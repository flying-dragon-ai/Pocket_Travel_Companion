import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { errorMessage, toastError, toastInfo, toastSuccess } from '@/utils/feedback'
import { MOOD_REFRESH_DAYS, normalizeMoodTags, shouldPromptMoodUpdate } from '@/utils/mood-map'
import { ensureSession } from '@/utils/session'
import { clearLoginSession, saveLoginSession } from '@/utils/auth'

const uniMock = globalThis.uni as unknown as {
  showToast: ReturnType<typeof vi.fn>
  login: ReturnType<typeof vi.fn>
  request: ReturnType<typeof vi.fn>
  getStorageSync: ReturnType<typeof vi.fn>
  setStorageSync: ReturnType<typeof vi.fn>
  removeStorageSync: ReturnType<typeof vi.fn>
}

describe('error helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefers the Error message and falls back otherwise', () => {
    expect(errorMessage(new Error('后端返回的文案'), '兜底')).toBe('后端返回的文案')
    expect(errorMessage(new Error(''), '兜底')).toBe('兜底')
    expect(errorMessage('字符串异常', '兜底')).toBe('兜底')
    expect(errorMessage(null, '兜底')).toBe('兜底')
    expect(errorMessage(undefined, '兜底')).toBe('兜底')
    expect(errorMessage({ message: '类 Error 对象' }, '兜底')).toBe('兜底')
  })

  it('renders the extracted message as a plain toast', () => {
    toastError(new Error('保存失败'), '兜底')
    expect(uniMock.showToast).toHaveBeenCalledWith({ title: '保存失败', icon: 'none' })

    toastError(42, '兜底')
    expect(uniMock.showToast).toHaveBeenLastCalledWith({ title: '兜底', icon: 'none' })
  })

  it('uses the success and neutral icons for the other two helpers', () => {
    toastSuccess('已保存')
    expect(uniMock.showToast).toHaveBeenLastCalledWith({ title: '已保存', icon: 'success' })

    toastInfo('请输入链接')
    expect(uniMock.showToast).toHaveBeenLastCalledWith({ title: '请输入链接', icon: 'none' })
  })
})

describe('mood profile helpers', () => {
  it('prompts when the profile is missing, malformed, or stale', () => {
    expect(shouldPromptMoodUpdate(undefined)).toBe(true)
    expect(shouldPromptMoodUpdate(null)).toBe(true)
    expect(shouldPromptMoodUpdate('not-a-date')).toBe(true)

    const fresh = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(shouldPromptMoodUpdate(fresh)).toBe(false)

    const stale = new Date(Date.now() - (MOOD_REFRESH_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldPromptMoodUpdate(stale)).toBe(true)
  })

  it('falls back to a placeholder when the backend returns no tags', () => {
    expect(normalizeMoodTags(['安静'])).toEqual(['安静'])
    expect(normalizeMoodTags([])).toEqual(['未设置'])
    expect(normalizeMoodTags(undefined)).toEqual(['未设置'])
    expect(normalizeMoodTags([], '放松中')).toEqual(['放松中'])
  })
})

describe('ensureSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const storage = new Map<string, unknown>()
    uniMock.getStorageSync.mockImplementation((key: string) => storage.get(key))
    uniMock.setStorageSync.mockImplementation((key: string, value: unknown) => storage.set(key, value))
    uniMock.removeStorageSync.mockImplementation((key: string) => storage.delete(key))
  })

  it('logs in when no token is stored', async () => {
    clearLoginSession()
    uniMock.login.mockImplementation(({ success }: { success: (res: { code: string }) => void }) =>
      success({ code: 'wx-code' })
    )
    uniMock.request.mockImplementation(
      ({ success }: { success: (res: unknown) => void }) =>
        success({ statusCode: 200, data: { code: 0, message: 'ok', data: { token: 't', openid: 'o' } } })
    )

    await ensureSession()

    expect(uniMock.login).toHaveBeenCalledTimes(1)
    expect(uniMock.request).toHaveBeenCalledTimes(1)
  })

  it('logs in when the stored token has expired', async () => {
    saveLoginSession({ token: 'stale', openid: 'o' })
    uniMock.setStorageSync.mockImplementationOnce(() => undefined)
    // 过期时间写成过去，触发重登分支
    uniMock.getStorageSync.mockImplementation((key: string) => (key === 'tokenExpireAt' ? 1 : 'stale'))
    uniMock.login.mockImplementation(({ success }: { success: (res: { code: string }) => void }) =>
      success({ code: 'wx-code' })
    )
    uniMock.request.mockImplementation(
      ({ success }: { success: (res: unknown) => void }) =>
        success({ statusCode: 200, data: { code: 0, message: 'ok', data: { token: 'fresh', openid: 'o' } } })
    )

    await ensureSession()

    expect(uniMock.login).toHaveBeenCalledTimes(1)
  })

  it('skips login when a valid token is present', async () => {
    saveLoginSession({ token: 'valid', openid: 'o' })

    await ensureSession()

    expect(uniMock.login).not.toHaveBeenCalled()
    expect(uniMock.request).not.toHaveBeenCalled()
  })
})
