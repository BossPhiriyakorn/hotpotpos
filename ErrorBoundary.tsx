import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h1>
            <p className="text-slate-600 mb-4">
              {this.state.error?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#BF0A30] text-white px-4 py-2 rounded-lg hover:bg-[#a00828]"
            >
              รีเฟรชหน้า
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

