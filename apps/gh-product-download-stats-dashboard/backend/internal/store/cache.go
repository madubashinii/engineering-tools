// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package store

import (
	"fmt"
	"sync"
	"time"
)

// statsCacheTTL bounds how stale a cached stats result can be. The underlying
// data only changes once per day (the 00:30 UTC sync cron), so a short TTL
// costs almost nothing in freshness while absorbing the expensive queries —
// notably full-history DailySeries, which joins ~1M asset-day pairs.
const statsCacheTTL = 15 * time.Minute

// statsCacheMaxEntries caps memory: on overflow the whole cache is reset
// rather than tracking LRU order — entries are cheap to recompute and the
// realistic key space (a handful of ranges × repos × intervals) never gets
// near the cap in normal use.
const statsCacheMaxEntries = 256

// ttlCache is a small concurrency-safe TTL cache with singleflight-style
// de-duplication: concurrent callers for the same missing key share one
// execution of fn instead of each running the query.
//
// Cached values are returned by reference and shared across callers — they
// must be treated as immutable.
type ttlCache struct {
	mu       sync.Mutex
	entries  map[string]cacheEntry
	inflight map[string]*inflightCall
	ttl      time.Duration
	max      int
}

type cacheEntry struct {
	val     any
	expires time.Time
}

type inflightCall struct {
	done chan struct{}
	val  any
	err  error
}

func newTTLCache(ttl time.Duration, maxEntries int) *ttlCache {
	return &ttlCache{
		entries:  map[string]cacheEntry{},
		inflight: map[string]*inflightCall{},
		ttl:      ttl,
		max:      maxEntries,
	}
}

// do returns the cached value for key, or runs fn to produce it. Errors are
// never cached, so a failed query is retried by the next caller. If the
// triggering caller's context is canceled mid-query, waiting callers receive
// that error too and the next request simply recomputes.
func (c *ttlCache) do(key string, fn func() (any, error)) (any, error) {
	c.mu.Lock()
	if e, ok := c.entries[key]; ok && time.Now().Before(e.expires) {
		c.mu.Unlock()
		return e.val, nil
	}
	if call, ok := c.inflight[key]; ok {
		c.mu.Unlock()
		<-call.done
		return call.val, call.err
	}
	call := &inflightCall{done: make(chan struct{})}
	c.inflight[key] = call
	c.mu.Unlock()

	// If fn panics, every other goroutine already blocked on <-call.done (and
	// every later caller for this key, since it stays in c.inflight) would
	// hang forever with no way to recover but a process restart. The deferred
	// recover unblocks them with an error and drops the inflight entry, then
	// re-panics so this call's own panic still propagates normally — only
	// concurrent bystanders get downgraded to an error, not the caller that
	// actually triggered it.
	panicked := true
	defer func() {
		if !panicked {
			return
		}
		r := recover()
		call.err = fmt.Errorf("ttlCache: panic computing key %q: %v", key, r)
		close(call.done)
		c.mu.Lock()
		delete(c.inflight, key)
		c.mu.Unlock()
		panic(r)
	}()

	call.val, call.err = fn()
	panicked = false
	close(call.done)

	c.mu.Lock()
	delete(c.inflight, key)
	if call.err == nil {
		if len(c.entries) >= c.max {
			c.entries = map[string]cacheEntry{}
		}
		c.entries[key] = cacheEntry{val: call.val, expires: time.Now().Add(c.ttl)}
	}
	c.mu.Unlock()
	return call.val, call.err
}

// purge drops every cached entry. Called by repository mutations (create,
// update, activate/deactivate) so admin changes are visible immediately
// instead of after TTL expiry.
func (c *ttlCache) purge() {
	c.mu.Lock()
	c.entries = map[string]cacheEntry{}
	c.mu.Unlock()
}

// cachedDo is the typed wrapper around ttlCache.do.
func cachedDo[T any](c *ttlCache, key string, fn func() (T, error)) (T, error) {
	v, err := c.do(key, func() (any, error) { return fn() })
	if err != nil {
		var zero T
		return zero, err
	}
	return v.(T), nil
}
