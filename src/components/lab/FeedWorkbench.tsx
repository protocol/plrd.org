"use client";
import { useState } from 'react';
import MixedScienceFeed from '@/components/lab/feed/MixedScienceFeed';
import PublicFeedSources from '@/components/lab/feed/PublicFeedSources';
import InventionComposer from '@/components/lab/feed/InventionComposer';
import styles from '@/components/lab/feed/feed.module.css';
export default function FeedWorkbench() {
  const [source, setSource] = useState(false), [compose, setCompose] = useState(false);
  return <div className={styles.root}>
    <header><h1>The workshop.</h1><p>Build an app. Test an idea. Leave something another person can improve.</p></header>
    <button className="lab-button lab-quiet" onClick={() => setCompose(true)}>What are you making? Show a build →</button>
    <nav className={styles.sourceNav} aria-label="Feed collection"><button aria-pressed={!source} onClick={() => setSource(false)}>Science feed</button><button aria-pressed={source} onClick={() => setSource(true)}>Public sources &amp; my records</button><a href="/lab/people/">People →</a></nav>
    {source ? <PublicFeedSources /> : <MixedScienceFeed />}
    {compose && <InventionComposer onClose={() => setCompose(false)} />}
  </div>;
}
