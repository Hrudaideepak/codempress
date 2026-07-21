import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // In production this would go to an error tracker; for now log to console.
    console.error("Unhandled UI error:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="container">
          <div className="state">
            <h2>Something went wrong</h2>
            <p>The page hit an unexpected error. You can try again.</p>
            <button className="btn btn-primary" onClick={this.handleReset}>
              Reload this view
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
