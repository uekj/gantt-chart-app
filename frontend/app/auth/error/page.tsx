'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: '設定エラー',
          message: 'サーバーの設定に問題があります。管理者にお問い合わせください。',
          description: 'OAuth設定が正しく構成されていません。'
        };
      case 'AccessDenied':
        return {
          title: 'アクセス拒否',
          message: 'ログインが拒否されました。',
          description: 'アカウントにアクセス権限がないか、ログインをキャンセルされました。'
        };
      case 'Verification':
        return {
          title: '認証エラー',
          message: 'メール認証に失敗しました。',
          description: '認証リンクが無効または期限切れです。'
        };
      case 'Default':
      default:
        return {
          title: 'ログインエラー',
          message: '予期しないエラーが発生しました。',
          description: 'しばらく時間をおいて再度お試しください。'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-red-100 rounded-full">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorInfo.message}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  詳細情報
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorInfo.description}</p>
                  {error && (
                    <p className="mt-2 text-xs">エラーコード: {error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              再度ログインを試す
            </Link>
            
            <Link
              href="/"
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ホームページに戻る
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              問題が解決しない場合は、
              <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-500">
                サポートチーム
              </a>
              までお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}