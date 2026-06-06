import { clearFailedTasks, useStore } from '../store'
import Select from './Select'
import { ChevronLeftIcon, CollectionManageIcon, FavoriteIcon, TrashIcon } from './icons'

export default function SearchBar() {
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const filterStatus = useStore((s) => s.filterStatus)
  const setFilterStatus = useStore((s) => s.setFilterStatus)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const setFilterFavorite = useStore((s) => s.setFilterFavorite)
  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)
  const setActiveFavoriteCollectionId = useStore((s) => s.setActiveFavoriteCollectionId)
  const openManageCollectionsModal = useStore((s) => s.openManageCollectionsModal)
  const tasks = useStore((s) => s.tasks)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const inCollectionOverview = filterFavorite && !activeFavoriteCollectionId
  const failedTaskIds = tasks.filter((task) => task.status === 'error').map((task) => task.id)
  const failedCount = failedTaskIds.length

  const handleFavoriteClick = () => {
    if (activeFavoriteCollectionId) {
      setActiveFavoriteCollectionId(null)
      return
    }
    setFilterFavorite(!filterFavorite)
  }

  const handleClearFailed = () => {
    if (failedCount === 0) return

    setConfirmDialog({
      title: '清除失败记录',
      message: `是否清除所有生成失败的记录？\n将删除 ${failedCount} 条失败记录，关联的孤立图片资源也会被清理。`,
      confirmText: '删除',
      cancelText: '取消',
      tone: 'danger',
      action: () => clearFailedTasks(),
    })
  }

  return (
    <div data-no-drag-select className="mt-6 mb-4 flex gap-3">
      <div className="flex gap-2 flex-shrink-0 z-20">
        <button
          onClick={handleFavoriteClick}
          className={`p-2.5 rounded-xl border transition-all ${
            filterFavorite
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500'
              : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
          }`}
          title={activeFavoriteCollectionId ? '返回收藏夹' : filterFavorite ? '退出收藏夹视图' : '收藏夹'}
        >
          {activeFavoriteCollectionId ? <ChevronLeftIcon className="w-5 h-5" /> : <FavoriteIcon filled={filterFavorite} className="w-5 h-5" />}
        </button>
        {inCollectionOverview && (
          <button
            onClick={openManageCollectionsModal}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
            title="管理收藏夹"
          >
            <CollectionManageIcon className="w-5 h-5" />
          </button>
        )}
        {!inCollectionOverview && (
          <>
            <div className="relative w-28">
              <Select
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as any)}
                options={[
                  { label: '全部状态', value: 'all' },
                  { label: '已完成', value: 'done' },
                  { label: '生成中', value: 'running' },
                  { label: '失败', value: 'error' },
                ]}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
            </div>
            <button
              type="button"
              onClick={handleClearFailed}
              disabled={failedCount === 0}
              title={failedCount > 0 ? `清除 ${failedCount} 条失败记录` : '没有失败记录'}
              aria-label={failedCount > 0 ? `清除 ${failedCount} 条失败记录` : '没有失败记录'}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-white disabled:hover:text-gray-400 dark:border-white/[0.08] dark:bg-gray-900 dark:text-gray-500 dark:hover:bg-white/[0.06] dark:hover:text-gray-300 dark:disabled:hover:bg-gray-900 dark:disabled:hover:text-gray-500"
            >
              <TrashIcon className="h-[18px] w-[18px]" />
            </button>
          </>
        )}
      </div>
      <div className="relative z-10 flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="text"
          placeholder={inCollectionOverview ? '搜索收藏夹名称...' : '搜索提示词、参数...'}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
        />
      </div>
    </div>
  )
}
