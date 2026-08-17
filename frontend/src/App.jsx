import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";

function App() {
  return (
    <div>
      <h1>MY APP</h1>

      <SignedOut>
        <SignInButton mode="modal">
          <button>Sign In</button>
        </SignInButton>

        <SignUpButton mode="modal">
          <button>Sign Up</button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}

export default App;