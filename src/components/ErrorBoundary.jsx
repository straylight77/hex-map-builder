import { Component } from 'react';

/**
 * Catches rendering errors from any child (including canvas draw calls that
 * propagate up through React) and shows a recovery UI instead of a blank screen.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-700 gap-4 p-8">
          <p className="text-lg font-semibold">Something went wrong rendering the map.</p>
          <p className="text-sm text-gray-500 font-mono max-w-lg text-center break-all">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
