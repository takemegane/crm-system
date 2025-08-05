import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

// Cloudinary設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Upload API called')
    
    const session = await getServerSession(authOptions)
    console.log('👤 Session user:', session?.user?.email || 'No session', 'role:', session?.user?.role)

    // オーナー、管理者、運営者がファイルアップロード可能（商品管理のため）
    if (!session || !['OWNER', 'ADMIN', 'OPERATOR'].includes(session.user.role)) {
      console.log('❌ Permission denied for user:', session?.user?.email, 'role:', session?.user?.role)
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    console.log('✅ Permission check passed')

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    console.log('📁 File info:', file ? `name: ${file.name}, size: ${file.size}, type: ${file.type}` : 'No file')

    if (!file) {
      console.log('❌ No file in request')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // ファイルタイプの検証
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type)
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // ファイルサイズの検証 (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 })
    }

    console.log('✅ File validation passed')

    // Cloudinary環境変数チェック
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ Cloudinary environment variables not configured')
      return NextResponse.json({ error: 'Image upload service not configured' }, { status: 500 })
    }

    console.log('✅ Cloudinary configuration found')

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('✅ File buffer created, size:', buffer.length)

    // Cloudinaryにアップロード
    console.log('☁️ Uploading to Cloudinary...')
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'crm-system', // Cloudinary内のフォルダ名
            public_id: `${Date.now()}-${file.name.split('.')[0]}`, // 一意のID生成
            overwrite: true,
            transformation: [
              { width: 1000, height: 1000, crop: 'limit' }, // 最大サイズ制限
              { quality: 'auto' } // 自動品質最適化
            ]
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error)
              reject(error)
            } else {
              console.log('✅ Cloudinary upload successful:', result?.public_id)
              resolve(result)
            }
          }
        ).end(buffer)
      })

      const result = uploadResult as any
      const fileUrl = result.secure_url
      console.log('🔗 Cloudinary URL:', fileUrl)

      console.log('🎉 Upload completed successfully')
      return NextResponse.json({ 
        success: true, 
        url: fileUrl,
        fileName: result.public_id,
        cloudinaryId: result.public_id
      })
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError)
      return NextResponse.json(
        { 
          error: 'Image upload failed',
          details: cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError)
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}