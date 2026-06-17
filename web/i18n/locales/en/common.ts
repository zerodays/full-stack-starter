export default {
  serverSays: "Server says: <strong>{{message}}</strong>",
  enterName: "Enter your name and click the button",
  namePlaceholder: "Your name",
  sayHello: "Say Hello",
  loading: "Loading...",
  switchLang: "Switch Language",

  // Projects demo
  projectsTitle: "Projects",
  projectsSignInPrompt: "Sign in to see your projects.",
  projectNamePlaceholder: "Project name",
  creating: "Creating...",
  create: "Create",
  delete: "Delete",

  // Auth demo
  authDemoTitle: "Auth Demo",
  loadingSession: "Loading session...",
  signedInAs: "Signed in as:",
  signOut: "Sign Out",
  signUp: "Sign Up",
  signIn: "Sign In",
  authNamePlaceholder: "Name",
  authEmailPlaceholder: "Email",
  authPasswordPlaceholder: "Password",
  signingUp: "Signing up...",
  signupFailed: "Signup failed",
  signedUpSuccess: "Signed up successfully!",
  signingIn: "Signing in...",
  signinFailed: "Sign in failed",
  signedInSuccess: "Signed in successfully!",
  signingOut: "Signing out...",
  signedOutSuccess: "Signed out successfully!",
  authSpanNote:
    "Auth actions are wrapped in OpenTelemetry spans. Check Axiom for traces!",
} as const;
