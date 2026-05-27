import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import Editor from './Editor';

export default function EditorApp({ guideId }: { guideId: string }) {
  return (
    <AuthProvider>
      <Editor guideId={guideId} />
    </AuthProvider>
  );
}