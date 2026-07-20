## Haptics Studio 2.4.0

This release improves editing reliability: folder drops now consistently create groups, analysis cancel restores previous values, and envelope editing fixes address cut-paste, point selection when scrolled, and group duplication.

### Bug Fixes

- Dropping a single folder now correctly creates a folder group instead of loose root clips.
- Saving a sample project under a new name now keeps it as a custom project: sample audio assets are copied next to the project.
- Restored analysis parameter sliders to previous values when cancelling the re-analysis confirmation dialog, preventing UI mismatch with the actual clip state.
- Fixed an issue when pasting the envelope content after Select All + Cut.
- Fixed repeated group duplication creating extra duplicate clips when selection contained both the group and its clips.
- Fixed envelope point hover affordance when timeline is scrolled.
