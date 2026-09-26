import unittest
import numpy as np
from packages.bio_agent.full_apps.action_selection import select_action


class ActionSelectionTests(unittest.TestCase):
    def test_untrained_ties_are_seeded_and_not_directionally_fixed(self):
        def run():
            rng=np.random.default_rng(17431)
            return [select_action(np.zeros(9),list(range(9)),rng) for _ in range(900)]
        a=run()
        self.assertEqual(a,run())
        counts=np.bincount([x[0] for x in a],minlength=9)
        self.assertTrue(all(65 < x < 135 for x in counts),counts)
        self.assertTrue(all(x[1]=='tie-break' for x in a))

    def test_mask_and_learned_preference_are_respected(self):
        rng=np.random.default_rng(2)
        for _ in range(30):
            self.assertEqual(select_action([100.,-3.,2.],[1,2],rng),(2,'policy'))
        for _ in range(20):
            action,mode=select_action([100.,-3.,2.],[1,2],rng,1.)
            self.assertIn(action,[1,2]);self.assertEqual(mode,'exploration')

if __name__=='__main__': unittest.main()
