import { useMarketStore } from '../../../store/useMarketStore'
import { FeedItem } from '../../shared/FeedItem'

export function FeedTab() {
  const feedItems = useMarketStore(s => s.feedItems)

  return (
    <div>
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--edge)',
        fontFamily: 'var(--font-mono)',
        fontSize: '7px',
        color: 'var(--muted)',
        letterSpacing: '3px',
      }}>
        LIVE ANALYSIS FEED
      </div>
      <div>
        {feedItems.length === 0 ? (
          <div style={{
            padding: '20px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--muted)',
            textAlign: 'center',
          }}>
            No feed items yet.
          </div>
        ) : (
          feedItems.map((item, i) => (
            <FeedItem key={i} time={item.time.slice(11, 16)} badge={item.badge} message={item.msg} />
          ))
        )}
      </div>
    </div>
  )
}
