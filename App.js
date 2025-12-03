// App.js
import 'react-native-gesture-handler';
import React, { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { View, Text, Button } from 'react-native';

import DrawerNavigator from './src/navigation/DrawerNavigator';
import { ProjectProvider } from './src/state/ProjectContext';

// ---- Error Boundary simples para exibir erros em vez de “tela branca”
function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
        <Text style={{ color: 'white', fontSize: 16, marginBottom: 12 }}>
          Opa — houve um erro durante a renderização:
        </Text>
        <Text style={{ color: '#ff8080', fontFamily: 'monospace', marginBottom: 16 }}>{String(error.message || error)}</Text>
        <Button title="Tentar novamente" onPress={() => setError(null)} />
      </View>
    );
  }

  return (
    <React.Suspense
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Carregando…</Text>
        </View>
      }
    >
      <ErrorCatcher onError={setError}>{children}</ErrorCatcher>
    </React.Suspense>
  );
}

class ErrorCatcher extends React.Component {
  componentDidCatch(e) {
    if (this.props.onError) this.props.onError(e);
  }
  render() {
    return this.props.children;
  }
}

export default function App() {
  const onReady = useCallback(() => {
    console.log('[NAV] pronto');
  }, []);

  const onStateChange = useCallback((state) => {
    console.log('[NAV] state:', JSON.stringify(state));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <ProjectProvider>
          <ErrorBoundary>
            <NavigationContainer
              theme={DefaultTheme} // trocaremos por tema do app mais tarde
              onReady={onReady}
              onStateChange={onStateChange}
            >
              <DrawerNavigator />
            </NavigationContainer>
          </ErrorBoundary>
        </ProjectProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
