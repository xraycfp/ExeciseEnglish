import { useEffect, useState } from 'react'

function SettingsPage(): React.ReactElement {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
  }, [])

  const handleSave = async (key: string, value: string): Promise<void> => {
    await window.api.setSetting(key, value)
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">设置</h1>

      <div className="space-y-6">
        {/* Echo practice settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">回音练习设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                回音停顿时间（秒）
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings['echoPauseSeconds'] || '3'}
                onChange={(e) => handleSave('echoPauseSeconds', e.target.value)}
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                播放完片段后，留给你心中回放的时间
              </p>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">API 密钥</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Anthropic API Key</label>
              <input
                type="password"
                value={settings['anthropicApiKey'] || ''}
                onChange={(e) => handleSave('anthropicApiKey', e.target.value)}
                placeholder="sk-ant-..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">用于AI对话练习和反馈</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Azure Speech Key
              </label>
              <input
                type="password"
                value={settings['azureSpeechKey'] || ''}
                onChange={(e) => handleSave('azureSpeechKey', e.target.value)}
                placeholder="输入密钥..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Azure Speech Region
              </label>
              <input
                type="text"
                value={settings['azureSpeechRegion'] || ''}
                onChange={(e) => handleSave('azureSpeechRegion', e.target.value)}
                placeholder="例如: eastus"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">用于发音评分（可选）</p>
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          已保存
        </div>
      )}
    </div>
  )
}

export default SettingsPage
