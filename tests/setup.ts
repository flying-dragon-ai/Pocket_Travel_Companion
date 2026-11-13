import { vi } from 'vitest'

vi.stubGlobal('uni', {
  navigateTo: vi.fn(),
  switchTab: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  login: vi.fn(),
  request: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  chooseImage: vi.fn(),
  getLocation: vi.fn(),
  openLocation: vi.fn()
})
