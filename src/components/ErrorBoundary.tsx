
import React from "react";
import { View, Text } from "react-native";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
          <Text style={{ color: "red", fontWeight: "700", marginBottom: 8 }}>
            Something crashed:
          </Text>
          <Text style={{ color: "red" }}>{this.state.error?.message}</Text>
          <Text style={{ color: "#666", marginTop: 12, fontSize: 12 }}>
            {this.state.error?.stack}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;