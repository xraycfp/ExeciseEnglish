import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMediaStore } from '../stores/media.store'

function LibraryPage(): React.ReactElement {
  const navigate = useNavigate()
  const { mediaList, loading, fetchMediaList, importMedia, deleteMedia } = useMediaStore()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchMediaList()
  }, [fetchMediaList])

  const handleImport = async (): Promise<void> => {
    const result = await importMedia()
    if (result) {
      navigate(`/media/${result.id}`)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    await deleteMedia(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">媒体库</h1>
          <p className="text-sm text-gray-500 mt-1">导入视频或音频文件开始练习</p>
        </div>
        <button
          onClick={handleImport}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>导入文件</span>
        </button>
      </div>

      {loading && mediaList.length === 0 ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : mediaList.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-gray-500 mb-4">媒体库为空</p>
          <button
            onClick={handleImport}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            导入第一个文件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaList.map((media) => (
            <div
              key={media.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Thumbnail / icon area */}
              <div
                className={`h-32 flex items-center justify-center cursor-pointer ${
                  media.mediaType === 'video' ? 'bg-blue-50' : 'bg-green-50'
                }`}
                onClick={() => navigate(`/media/${media.id}`)}
              >
                <span className="text-5xl opacity-60">
                  {media.mediaType === 'video' ? '🎬' : '🎵'}
                </span>
              </div>

              <div className="p-4">
                <h3
                  className="font-medium text-gray-900 truncate cursor-pointer hover:text-primary-600"
                  onClick={() => navigate(`/media/${media.id}`)}
                >
                  {media.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {(media.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      media.transcriptionStatus === 'completed'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {media.transcriptionStatus === 'completed' ? '已转录' : '待转录'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/media/${media.id}`)}
                    className="flex-1 text-sm text-primary-600 hover:text-primary-700 py-1"
                  >
                    查看详情
                  </button>
                  {confirmDelete === media.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(media.id)}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-400 hover:text-gray-500 px-2 py-1"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(media.id)}
                      className="text-sm text-gray-400 hover:text-red-500 py-1 px-2"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LibraryPage
