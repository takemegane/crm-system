'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Enrollment {
  id: string
  courseId: string
  enrolledAt: string
  status: string
  course: {
    id: string
    name: string
    description?: string
    price: number
  }
}

type SystemSettings = {
  systemName: string
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
}

export default function MyPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('account')
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ systemName: 'マイページ' })

  // 顧客のコース情報を取得
  const fetchEnrollments = useCallback(async () => {
    try {
      const response = await fetch('/api/customer-enrollments')
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data.enrollments || [])
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // システム設定を取得
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const response = await fetch('/api/system-settings')
        if (response.ok) {
          const settings = await response.json()
          setSystemSettings(settings)
        }
      } catch (error) {
        console.error('Error fetching system settings:', error)
      }
    }
    fetchSystemSettings()
  }, [])

  useEffect(() => {
    if (session === undefined) {
      // セッション読み込み中は何もしない
      return
    }
    
    if (session?.user?.userType === 'customer') {
      fetchEnrollments()
    } else if (session?.user?.userType === 'admin') {
      router.push('/dashboard')
    } else if (session === null) {
      // セッションが明示的にnullの場合のみログインページにリダイレクト
      router.push('/login')
    }
  }, [session, router, fetchEnrollments])

  // コースが付与されているかチェック
  const hasEnrollments = enrollments.length > 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {systemSettings?.logoUrl ? (
                <div className="h-10 w-10 rounded-xl overflow-hidden mr-3 shadow-lg">
                  <Image
                    src={systemSettings.logoUrl}
                    alt={systemSettings.systemName}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center mr-3 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)' }}
                >
                  <span className="text-white font-bold text-lg">
                    {systemSettings?.systemName?.charAt(0) || 'M'}
                  </span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{systemSettings.systemName}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                こんにちは、{session?.user?.name}さん
              </span>
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar Menu */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">メニュー</h2>
            <nav className="space-y-2">
              <Link 
                href="/mypage/profile"
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="mr-3">👤</span>
                アカウント
              </Link>
              <Link 
                href="/mypage/shop"
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="mr-3">🛍️</span>
                ショップ
              </Link>
              {hasEnrollments && (
                <Link 
                  href="/mypage/community"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="mr-3">🏘️</span>
                  コミュニティ
                </Link>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">ダッシュボード</h3>
              
              {/* Welcome Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-medium text-blue-900 mb-2">
                  ようこそ、{session?.user?.name}さん！
                </h4>
                <p className="text-blue-700">
                  こちらはあなたのマイページです。左のメニューから各機能をご利用ください。
                </p>
              </div>

              {/* Course Status */}
              {hasEnrollments ? (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">受講中のコース</h4>
                  <div className="grid gap-4">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900">{enrollment.course.name}</h5>
                        {enrollment.course.description && (
                          <p className="text-sm text-gray-600 mt-1">{enrollment.course.description}</p>
                        )}
                        <div className="flex justify-between items-center mt-3">
                          <div>
                            <span className="text-sm text-gray-500">
                              受講開始: {new Date(enrollment.enrolledAt).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                              受講中
                            </span>
                            <Link
                              href={`/mypage/courses/${enrollment.courseId}`}
                              className="inline-flex px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              コース画面
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">コースが見つかりません</h4>
                  <p className="text-gray-600">現在受講中のコースはありません。</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/mypage/profile">
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <h5 className="font-semibold text-gray-900 mb-2">アカウント設定</h5>
                    <p className="text-sm text-gray-600">プロフィール情報の確認・編集</p>
                  </div>
                </Link>
                <Link href="/mypage/shop">
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <h5 className="font-semibold text-gray-900 mb-2">ショップ</h5>
                    <p className="text-sm text-gray-600">商品の閲覧・購入</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}