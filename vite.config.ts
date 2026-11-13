import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const repository = process.env.GITHUB_REPOSITORY ?? ''
const [owner, repositoryName] = repository.split('/')
const isGitHubUserSite = repositoryName === `${owner}.github.io`
const base =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isGitHubUserSite
    ? `/${repositoryName}/`
    : '/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    host: true,
    allowedHosts: true,
    strictPort: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/testSetup.ts',
  },
})
