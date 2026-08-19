import assert from "node:assert";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { sendMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

async function runTests() {
  console.log("Starting backend tests...");

  // Unit test 1: protectRoute populates req.user with MongoDB user including _id
  {
    console.log("Test 1: protectRoute populates req.user with MongoDB user including _id");
    const fakeUserId = new mongoose.Types.ObjectId();
    const mockUserDoc = {
      _id: fakeUserId,
      clerkId: "user_test_123",
      email: "test@example.com",
      fullName: "Test User",
    };

    const origFindOne = User.findOne;
    User.findOne = async (query) => {
      if (query.clerkId === "user_test_123") return mockUserDoc;
      return null;
    };

    const req = { auth: { userId: "user_test_123" } };
    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseBody = data; return this; },
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await protectRoute(req, res, next);

    assert.strictEqual(nextCalled, true, "next() should be called when user exists");
    assert.strictEqual(req.user, mockUserDoc, "req.user should match mockUserDoc");
    assert.strictEqual(req.user._id, fakeUserId, "req.user._id should exist");

    User.findOne = origFindOne;
    console.log("Test 1 passed!");
  }

  // Unit test 2: protectRoute auto-syncs user from Clerk if missing in DB
  {
    console.log("Test 2: protectRoute auto-syncs new user from Clerk when not found in DB");
    const newUserId = new mongoose.Types.ObjectId();
    const createdUserDoc = {
      _id: newUserId,
      clerkId: "user_new_456",
      email: "newuser@example.com",
      fullName: "New User",
      profilePic: "https://example.com/pic.png",
    };

    const origFindOne = User.findOne;
    User.findOne = async () => null;

    const origFindOneAndUpdate = User.findOneAndUpdate;
    User.findOneAndUpdate = async (filter, update) => {
      assert.strictEqual(filter.clerkId, "user_new_456");
      return createdUserDoc;
    };

    const req = { auth: { userId: "user_new_456" } };
    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseBody = data; return this; },
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await protectRoute(req, res, next);

    assert.strictEqual(nextCalled, true, "next() should be called");
    assert.strictEqual(req.user._id, newUserId, "req.user._id should be populated after sync");

    User.findOne = origFindOne;
    User.findOneAndUpdate = origFindOneAndUpdate;
    console.log("Test 2 passed!");
  }

  // Unit test 3: sendMessage uses req.user._id as senderId
  {
    console.log("Test 3: sendMessage uses req.user._id for message creation");
    const senderId = new mongoose.Types.ObjectId();
    const receiverId = new mongoose.Types.ObjectId();

    const req = {
      user: { _id: senderId, clerkId: "user_test_123" },
      params: { id: receiverId.toString() },
      body: { text: "Hello World" },
    };

    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    let savedMessage = null;
    const origSave = Message.prototype.save;
    Message.prototype.save = async function () {
      savedMessage = this;
      return this;
    };

    await sendMessage(req, res);

    assert.strictEqual(responseStatus, 201, "Response status should be 201");
    assert.strictEqual(savedMessage.senderId, senderId, "senderId must be req.user._id");
    assert.strictEqual(savedMessage.text, "Hello World", "message text must match");

    Message.prototype.save = origSave;
    console.log("Test 3 passed!");
  }

  console.log("All backend tests completed successfully!");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
