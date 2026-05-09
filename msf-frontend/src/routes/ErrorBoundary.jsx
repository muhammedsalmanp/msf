import React from 'react';
// Import the UI page you want to show when an error happens
import SomethingWentWrongPage from '../page/SomethingWentWrongPage'; 

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // If an error was caught, render the error page
      return <SomethingWentWrongPage />;
    }

    // If no error, render the children (your app)
    return this.props.children;
  }
}

export default ErrorBoundary;