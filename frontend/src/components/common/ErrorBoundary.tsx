/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import state from '../../state';
import appSlice from '../../state/app/slice';

interface ErrorBoundaryProps {
  children: React.ReactElement<any>;
  undoAction?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  public componentDidCatch(error: Error): void {
    state.store.dispatch(
      appSlice.actions.reportFrontendError({
        error: `${error.name}: ${error.message}`,
        componentStack: error.stack ?? '',
      }),
    );
  }

  render(): JSX.Element {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          {'Haptics Studio\nencountered an unexpected error.'}
          <div style={{display: 'flex', gap: '8px'}}>
            {this.props.undoAction ? (
              <div
                className="hsbutton secondary"
                onClick={this.props.undoAction}>
                Undo last action
              </div>
            ) : null}
            <div
              className="hsbutton"
              onClick={() => this.setState({hasError: false})}>
              Try Again
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
