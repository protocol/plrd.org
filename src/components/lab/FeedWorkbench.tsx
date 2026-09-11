"use client";
import { useState } from 'react';
import MixedScienceFeed from '@/components/lab/feed/MixedScienceFeed';
import PublicFeedSources from '@/components/lab/feed/PublicFeedSources';
import InventionComposer from '@/components/lab/feed/InventionComposer';
import styles from '@/components/lab/feed/feed.module.css';
export default function FeedWorkbench() {
  const [source, setSource] = useState(false), [compose, setCompose] = useState(false);
  return <div className={styles.root}>
    <header className={styles.workshopHeader} aria-label="Workshop invitation"><div><h1>Catch up</h1><p>Find what changed. Leave one useful next step.</p></div><button className="lab-button lab-quiet" aria-label="What are you making? Show a build →" onClick={() => setCompose(true)}>Show a build →</button></header>
    <nav className={styles.sourceNav} aria-label="Feed collection"><button aria-pressed={!source} onClick={() => setSource(false)}>Science feed</button><button aria-pressed={source} onClick={() => setSource(true)}>Public sources &amp; my records</button><a href="/lab/people/">People →</a></nav>
    {source ? <PublicFeedSources /> : <MixedScienceFeed />}
    {compose && <InventionComposer onClose={() => setCompose(false)} />}
  </div>;
}
