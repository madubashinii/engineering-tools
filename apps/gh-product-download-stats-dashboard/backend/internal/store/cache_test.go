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
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestTTLCacheHitAndMiss(t *testing.T) {
	c := newTTLCache(time.Minute, 8)
	calls := 0
	fn := func() (int, error) { calls++; return 42, nil }

	v, err := cachedDo(c, "k", fn)
	if err != nil || v != 42 {
		t.Fatalf("first call: got %d, %v", v, err)
	}
	v, err = cachedDo(c, "k", fn)
	if err != nil || v != 42 {
		t.Fatalf("second call: got %d, %v", v, err)
	}
	if calls != 1 {
		t.Fatalf("fn ran %d times, want 1 (second call should hit cache)", calls)
	}

	if _, err := cachedDo(c, "other", fn); err != nil {
		t.Fatal(err)
	}
	if calls != 2 {
		t.Fatalf("fn ran %d times, want 2 (different key must miss)", calls)
	}
}

func TestTTLCacheExpiry(t *testing.T) {
	c := newTTLCache(10*time.Millisecond, 8)
	calls := 0
	fn := func() (string, error) { calls++; return "v", nil }

	if _, err := cachedDo(c, "k", fn); err != nil {
		t.Fatal(err)
	}
	time.Sleep(20 * time.Millisecond)
	if _, err := cachedDo(c, "k", fn); err != nil {
		t.Fatal(err)
	}
	if calls != 2 {
		t.Fatalf("fn ran %d times, want 2 (entry should have expired)", calls)
	}
}

func TestTTLCacheErrorNotCached(t *testing.T) {
	c := newTTLCache(time.Minute, 8)
	calls := 0
	boom := errors.New("boom")
	fn := func() (int, error) {
		calls++
		if calls == 1 {
			return 0, boom
		}
		return 7, nil
	}

	if _, err := cachedDo(c, "k", fn); !errors.Is(err, boom) {
		t.Fatalf("first call: want boom, got %v", err)
	}
	v, err := cachedDo(c, "k", fn)
	if err != nil || v != 7 {
		t.Fatalf("second call: got %d, %v (error must not be cached)", v, err)
	}
}

func TestTTLCachePurge(t *testing.T) {
	c := newTTLCache(time.Minute, 8)
	calls := 0
	fn := func() (int, error) { calls++; return 1, nil }

	if _, err := cachedDo(c, "k", fn); err != nil {
		t.Fatal(err)
	}
	c.purge()
	if _, err := cachedDo(c, "k", fn); err != nil {
		t.Fatal(err)
	}
	if calls != 2 {
		t.Fatalf("fn ran %d times, want 2 (purge must drop the entry)", calls)
	}
}

func TestTTLCacheSingleflight(t *testing.T) {
	c := newTTLCache(time.Minute, 8)
	var calls atomic.Int32
	release := make(chan struct{})
	fn := func() (int, error) {
		calls.Add(1)
		<-release
		return 9, nil
	}

	const n = 10
	var wg sync.WaitGroup
	results := make([]int, n)
	for i := range n {
		wg.Add(1)
		go func() {
			defer wg.Done()
			v, err := cachedDo(c, "k", fn)
			if err != nil {
				t.Error(err)
			}
			results[i] = v
		}()
	}
	// Give the goroutines time to pile up on the same key, then release.
	time.Sleep(20 * time.Millisecond)
	close(release)
	wg.Wait()

	if got := calls.Load(); got != 1 {
		t.Fatalf("fn ran %d times, want 1 (concurrent misses must share one execution)", got)
	}
	for i, v := range results {
		if v != 9 {
			t.Fatalf("caller %d got %d, want 9", i, v)
		}
	}
}
