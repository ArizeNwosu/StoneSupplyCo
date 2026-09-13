// src/data/skins.ts
import type { MechanicPrimitive } from '../types';

export interface SkinMeta {
  id: string;
  label: string;
  description: string;
}

export const SKIN_REGISTRY: Record<MechanicPrimitive, SkinMeta[]> = {
  precision_stop: [
    { id: 'pour_drink', label: 'Pour Drink', description: 'Liquid auto-pours, tap to stop at target line' },
    { id: 'stopwatch', label: 'Stopwatch', description: 'Classic circular timer face' },
    { id: 'ruler', label: 'Ruler', description: 'Tape extends, stop at measurement mark' },
    { id: 'fuel_gauge', label: 'Fuel Gauge', description: 'Needle sweeps, stop in target zone' },
    { id: 'countdown_bar', label: 'Countdown Bar', description: 'Horizontal bar depletes' },
  ],
  multi_dial: [
    { id: 'combination_lock', label: 'Combination Lock', description: '3 vertical number wheels, drag up/down' },
    { id: 'slot_reels', label: 'Slot Reels', description: 'Spinning reels with custom symbols' },
    { id: 'safe_dial', label: 'Safe Dial', description: 'Single circular dial with sequence' },
  ],
  pick_one: [
    { id: 'mystery_box', label: 'Mystery Box', description: 'N boxes, tap to reveal' },
    { id: 'card_flip', label: 'Card Flip', description: 'Playing cards face-down, flip to reveal' },
    { id: 'capsule_machine', label: 'Capsule Machine', description: 'Gumball-style capsule drop' },
  ],
  hold_release: [
    { id: 'strength_meter', label: 'Strength Meter', description: 'Charge bar fills while held, release at peak zone' },
    { id: 'tension_bow', label: 'Tension Bow', description: 'Pull back to optimal tension' },
  ],
  reaction: [
    { id: 'flash_tap', label: 'Flash Tap', description: 'Screen flashes, tap immediately' },
    { id: 'catch_object', label: 'Catch Object', description: 'Branded object falls, tap to catch' },
  ],
  drag_target: [
    { id: 'pack_bag', label: 'Pack the Bag', description: 'Drag product items into a bag/container' },
    { id: 'sort_items', label: 'Sort Items', description: 'Drag items to correct labeled bins' },
  ],
  fill_meter: [
    { id: 'charge_bar', label: 'Charge Bar', description: 'Tap/hold to fill to the target zone' },
    { id: 'stack_coins', label: 'Stack Coins', description: 'Stack coins to reach prize tier' },
  ],
};
