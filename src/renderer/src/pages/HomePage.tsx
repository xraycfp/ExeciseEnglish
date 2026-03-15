import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useMediaStore } from '../stores/media.store'

function HomePage(): React.ReactElement {
  const navigate = useNavigate()
  const { mediaList, fetchMediaList } = useMediaStore()

  useEffect(() => {
    fetchMediaList()
  }, [fetchMediaList])

  const recentMedia = mediaList.slice(0, 5)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用 EchoEnglish</h1>
        <p className="text-gray-500">通过回音法高效练习英语听说能力</p>
      </div>

      {/* Practice modes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">回音练习</h3>
          <p className="text-blue-100 text-sm mb-4">
            听一句 → 心中回响 → 模仿发音 → 对比原声
          </p>
          <button
            onClick={() => navigate('/library')}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            选择素材开始
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">听写练习</h3>
          <p className="text-purple-100 text-sm mb-4">
            听音频内容，键入听到的文字，检验听力理解
          </p>
          <button
            onClick={() => navigate('/library')}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            选择素材开始
          </button>
        </div>
      </div>

      {/* Recent media */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">最近导入</h2>
          <button
            onClick={() => navigate('/library')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            查看全部 →
          </button>
        </div>

        {recentMedia.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">还没有导入任何媒体文件</p>
            <button
              onClick={() => navigate('/library')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              去导入
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentMedia.map((media) => (
              <button
                key={media.id}
                onClick={() => navigate(`/media/${media.id}`)}
                className="w-full flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow text-left border border-gray-100"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    media.mediaType === 'video'
                      ? 'bg-blue-50 text-blue-500'
                      : 'bg-green-50 text-green-500'
                  }`}
                >
                  {media.mediaType === 'video' ? '🎬' : '🎵'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{media.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(media.importedAt).toLocaleDateString('zh-CN')}
                    {' · '}
                    {(media.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    media.transcriptionStatus === 'completed'
                      ? 'bg-green-50 text-green-600'
                      : media.transcriptionStatus === 'processing'
                        ? 'bg-yellow-50 text-yellow-600'
                        : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {media.transcriptionStatus === 'completed'
                    ? '已转录'
                    : media.transcriptionStatus === 'processing'
                      ? '转录中'
                      : '待转录'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
