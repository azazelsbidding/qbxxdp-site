import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(awsExports);

export default function App() {
  return (
    <Authenticator signUpAttributes={['email']}>
      {({ signOut, user }) => (
        <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
          <h1>Welcome, {user.username}!</h1>
          <p>You are signed in with Amplify Authenticator.</p>
          <button
            onClick={signOut}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </main>
      )}
    </Authenticator>
  );
}

