'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/hooks/use-products'
import { useCategories } from '@/hooks/use-categories'
import { useCart, useAddToCart } from '@/hooks/use-cart'

type Product = {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  imageUrl?: string
  categoryId?: string
  sortOrder: number
  category?: {
    id: string
    name: string
  }
  isActive: boolean
}

export default function ShopPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  
  // TanStack Query hooks を使用
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts({ search, category })
  const { data: categoriesData } = useCategories()
  const { data: cart, isLoading: cartLoading } = useCart()
  const addToCartMutation = useAddToCart()

  // キャッシュシステムを使用するため、手動のfetch関数は不要

  useEffect(() => {
    if (session === undefined) {
      // セッション読み込み中は何もしない
      return
    }
    
    if (session?.user?.userType === 'admin') {
      router.push('/dashboard')
    } else if (session === null) {
      // セッションが明示的にnullの場合のみログインページにリダイレクト
      router.push('/login')
    }
  }, [session, router])

  const handleAddToCart = async (productId: string) => {
    if (!session?.user || session.user.userType !== 'customer') {
      alert('カートに追加するにはログインが必要です')
      return
    }

    setAddingToCart(productId)
    try {
      await addToCartMutation.mutateAsync({
        productId,
        quantity: 1
      })
      alert('カートに追加しました')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert(error instanceof Error ? error.message : 'カートに追加できませんでした')
    } finally {
      setAddingToCart(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ショップサブメニュー */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🛍️ ショップ</h2>
          
          {/* レスポンシブメニュー */}
          <div className="space-y-4 sm:space-y-0">
            {/* PC版: 横並びレイアウト */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              {/* 左側: 検索とカテゴリ */}
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    商品検索
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-64"
                    placeholder="商品名を入力..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    カテゴリ
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">すべて</option>
                    {categoriesData?.categories?.map((cat: { id: string, name: string }) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    )) || []}
                  </select>
                </div>
              </div>
              
              {/* 右側: 注文履歴とカート */}
              <div className="flex items-center space-x-2">
                <Link href="/mypage/shop/orders">
                  <Button variant="outline" size="sm" className="text-sm">
                    📋 注文履歴
                  </Button>
                </Link>
                <Link href="/mypage/shop/cart">
                  <Button variant="outline" size="sm" className="relative text-sm">
                    🛒 カート
                    {!cartLoading && cart && cart.itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {cart.itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>

            {/* スマホ版: 縦積みレイアウト */}
            <div className="sm:hidden space-y-4">
              {/* 検索バー（全幅） */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  商品検索
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="商品名を入力..."
                />
              </div>
              
              {/* カテゴリ（全幅） */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  カテゴリ
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="">すべて</option>
                  {categoriesData?.categories?.map((cat: { id: string, name: string }) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  )) || []}
                </select>
              </div>
              
              {/* 注文履歴とカート（中央揃え） */}
              <div className="flex justify-center space-x-4 pt-2">
                <Link href="/mypage/shop/orders">
                  <Button variant="outline" className="min-h-[48px] px-6">
                    📋 注文履歴
                  </Button>
                </Link>
                <Link href="/mypage/shop/cart">
                  <Button variant="outline" className="relative min-h-[48px] px-6">
                    🛒 カート
                    {!cartLoading && cart && cart.itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                        {cart.itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className="text-center py-16">
          <div className="text-lg">読み込み中...</div>
        </div>
      ) : productsError ? (
        <div className="text-center py-16 text-red-600">
          <p>商品の取得に失敗しました</p>
        </div>
      ) : !productsData?.products || productsData.products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>商品が見つかりません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsData.products.map((product: Product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {product.imageUrl && (
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {product.category.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    在庫: {product.stock}個
                  </span>
                  <Button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0 || addingToCart === product.id || addToCartMutation.isPending}
                    size="sm"
                    className="min-h-[44px] sm:min-h-auto px-4 sm:px-3 text-sm"
                  >
                    {addingToCart === product.id || addToCartMutation.isPending ? (
                      '追加中...'
                    ) : product.stock === 0 ? (
                      '在庫切れ'
                    ) : (
                      'カートに追加'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}