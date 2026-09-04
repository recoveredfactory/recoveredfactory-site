#!/usr/bin/env bash
# Back up the binary assets that are deliberately not in git.
#
# static/images and static/videos are gitignored by design — they are build
# inputs that ship through `pnpm deploy`, not source — which means the working
# copy on one laptop is the only copy. That is fine until it isn't. This pushes
# them to S3 so a lost disk costs a download instead of a re-render.
#
# Usage: pnpm backup:assets [--dry-run] [--with-video-processing]
#
# Deliberately NOT `sync --delete`. This is a backup, not a mirror: deleting a
# file locally must never delete the backup of it. The bucket is versioned, so
# overwriting a file locally and syncing keeps the old bytes retrievable too.
#
# The bucket lives outside the SST app on purpose. An `sst.Bucket` is owned by
# the stage that declares it, and `sst remove` would take the backups down with
# the infrastructure — precisely the correlated failure a backup exists to
# prevent. It is created once, by hand, and outlives any given deploy.

set -euo pipefail

BUCKET="${ASSETS_BACKUP_BUCKET:-recoveredfactory-assets-backup}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DRY_RUN=""
WITH_VIDEO_PROCESSING=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dryrun" ;;
    --with-video-processing) WITH_VIDEO_PROCESSING=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

if ! aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
  echo "Cannot reach s3://$BUCKET — check credentials, or create it first." >&2
  exit 1
fi

sync_dir() {
  local src="$1" dest="$2"
  shift 2
  if [ ! -d "$ROOT/$src" ]; then
    echo "Skipping $src (not present)"
    return
  fi
  echo "→ $src"
  # shellcheck disable=SC2086 # $DRY_RUN is one optional flag or empty
  aws s3 sync "$ROOT/$src" "s3://$BUCKET/$dest" $DRY_RUN --no-progress "$@"
}

sync_dir apps/web/static/images images
sync_dir apps/web/static/videos videos
sync_dir apps/daybook/static/images daybook/images

# The rendered frames are a scratch directory — ffmpeg makes them again from the
# source video in seconds, and there are hundreds of them. The source cut is what
# would actually hurt to lose, so it goes and they don't. Off by default because
# it is ~190MB and changes almost never.
if [ -n "$WITH_VIDEO_PROCESSING" ]; then
  sync_dir video-processing video-processing --exclude "frame*.png"
fi

echo
echo "Done. Contents of s3://$BUCKET:"
aws s3 ls "s3://$BUCKET" --recursive --summarize | tail -3
