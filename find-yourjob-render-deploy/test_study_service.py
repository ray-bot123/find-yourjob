import unittest
from study_service import execution_messages, validate_execution
class StudyTests(unittest.TestCase):
    def test_daily_schema(self):
        self.assertEqual(validate_execution({'assignment':'20 minutes: build and check a pivot table.'},'daily-plan')['assignment'][:2],'20')
        with self.assertRaises(ValueError): validate_execution({'assignment':''},'daily-plan')
    def test_daily_context(self):
        messages=execution_messages({'mode':'daily-plan','execution':{'day':2,'minutes':60}},'A fictional reporting background.')
        self.assertIn('timed learning',messages[0]['content'])
        self.assertIn('"minutes": 60',messages[1]['content'])
    def test_review_requires_boolean(self):
        with self.assertRaises(ValueError): validate_execution({'feedback':'Needs evidence','accepted':'yes'},'review-study')
if __name__=='__main__':unittest.main()
