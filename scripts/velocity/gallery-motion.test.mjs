import { test } from 'node:test'
import assert from 'node:assert/strict'
import { source } from './test-source-loader.mjs'

test('gallery entrance fans cards from one stack into measured grid slots with spring and stagger', () => {
  const { galleryFanMotion } = source('components/useGalleryFan.ts')
  const slots = [{ left: 0, top: 0, width: 420 }, { left: 436, top: 0, width: 420 }, { left: 0, top: 450, width: 420 }]
  const plans = slots.map((slot, index) => galleryFanMotion(slot, slots[0], index, slots.length))
  for (const [index, plan] of plans.entries()) {
    assert.equal(plan.keyframes.x[0] + slots[index].left, index * 8, 'same stack origin, not a small per-card slide')
    assert.equal(plan.keyframes.y[0] + slots[index].top, index * 6)
    for (const key of ['x', 'y', 'rotate']) assert.equal(plan.keyframes[key][1], 0)
    assert.equal(plan.keyframes.scale[1], 1)
    assert.equal(plan.transition.type, 'spring')
    assert.ok(plan.transition.damping > 0)
    if (index) assert.ok(plan.transition.delay > plans[index - 1].transition.delay)
  }
  const single = galleryFanMotion(slots[0], slots[0], 0, 1)
  assert.deepEqual(single.keyframes.rotate, [0, 0])
})
