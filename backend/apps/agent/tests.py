from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from . import tools


class GitHubWriteFileTests(SimpleTestCase):
    @patch("apps.agent.tools.requests.put")
    @patch("apps.agent.tools.requests.get")
    def test_creates_file_on_selected_branch(self, get, put):
        get.return_value = Mock(ok=False, status_code=404)
        put.return_value = Mock(ok=True, status_code=201)

        result = tools.github_write_file(
            "token",
            "Landry12-BAS/skilled-eagle-agent",
            "frontend/src/app/games/snake/page.tsx",
            "export default function Snake() { return null; }",
            "main",
            "Create Snake game",
        )

        self.assertEqual(result, "Successfully created 'frontend/src/app/games/snake/page.tsx' on Landry12-BAS/skilled-eagle-agent@main.")
        put.assert_called_once()
        _, kwargs = put.call_args
        self.assertEqual(kwargs["json"]["branch"], "main")
        self.assertEqual(kwargs["json"]["message"], "Create Snake game")
        self.assertNotIn("sha", kwargs["json"])

    @patch("apps.agent.tools.requests.put")
    @patch("apps.agent.tools.requests.get")
    def test_updates_existing_file_with_its_sha(self, get, put):
        get.return_value = Mock(ok=True, json=lambda: {"sha": "existing-sha"})
        put.return_value = Mock(ok=True, status_code=200)

        result = tools.github_write_file(
            "token",
            "Landry12-BAS/skilled-eagle-agent",
            "frontend/src/app/page.tsx",
            "updated",
            "main",
            "Update home page",
        )

        self.assertEqual(result, "Successfully updated 'frontend/src/app/page.tsx' on Landry12-BAS/skilled-eagle-agent@main.")
        _, kwargs = put.call_args
        self.assertEqual(kwargs["json"]["sha"], "existing-sha")
