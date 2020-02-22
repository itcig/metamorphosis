module.exports = {
	hooks: {
		// Update changelog and add to publish commit
		'after:bump': 'npm run changelog',
	},
	git: {
		changelog: 'npx auto-changelog -p --commit-limit false --stdout --unreleased --template tpl-release-changes.hbs',
		commitMessage: 'chore(release): Publish v${version}',
		requireUpstream: false,
		tagName: 'v${version}',
	},
	github: {
		release: true,
		releaseName: '${version}',
	},
};
