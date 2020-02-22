module.exports = {
	hooks: {
		// Test that auto-changelog will run so options here are irrelevant
		'before:release': 'npm run changelog',
	},
	git: {
		changelog: 'npx auto-changelog -p --commit-limit false --stdout --unreleased --template tpl-release-changes.hbs',
		commitMessage: 'chore(release): Publish v${version}',
		requireUpstream: false,
		tagName: 'v${version}',
	},
	github: {
		release: true,
	},
};
