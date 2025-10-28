const Track = require('../models/track.model');

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const unique = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

const createTrackVariants = (value) => {
  if (value === undefined || value === null) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  const lower = raw.toLowerCase();
  const upper = raw.toUpperCase();
  const condensed = lower.replace(/[^a-z0-9]/g, '');
  const underscored = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const hyphenated = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$|/g, '');
  const segments = underscored ? underscored.split('_').filter(Boolean) : [];
  const firstSegment = segments[0] || null;

  const withTrackPrefix = firstSegment ? `track_${firstSegment}` : null;
  const combinedSegments = segments.length ? segments.join('_') : '';

  return unique([
    raw,
    lower,
    upper,
    condensed,
    underscored,
    hyphenated,
    firstSegment,
    withTrackPrefix,
    combinedSegments ? `track_${combinedSegments}` : null,
    combinedSegments ? `track-${combinedSegments.replace(/_/g, '-')}` : null,
    combinedSegments ? `track${combinedSegments.replace(/_/g, '')}` : null,
  ]);
};

const buildTrackAliases = (track) => {
  const aliases = new Set();
  if (!track) return aliases;

  const push = (value) => {
    createTrackVariants(value).forEach((variant) => aliases.add(variant));
  };

  push(track._id);
  push(track.id);
  push(track.trackId);
  push(track.legacyId);
  push(track.slug);
  push(track.code);

  if (track.name) {
    const nameSlug = toSlug(track.name);
    push(nameSlug);
    push(`track_${nameSlug}`);
    const segments = nameSlug.split('_').filter(Boolean);
    if (segments.length) {
      push(`track_${segments[0]}`);
      push(segments[0]);
    }
  }

  if (typeof track.order === 'number') {
    push(`track_${track.order}`);
    push(`track${track.order}`);
  }

  return aliases;
};

const uniqueModuleTrackVariants = (track) => {
  if (!track) return [];
  const variants = new Set();
  [
    track?._id,
    track?.id,
    track?.trackId,
    track?.legacyId,
    track?.slug,
    track?.code,
  ].forEach((value) => {
    createTrackVariants(value).forEach((variant) =>
      variants.add(String(variant))
    );
  });
  return Array.from(variants);
};

const attachTrackProgressToContext = (context, trackProgress, trackDoc) => {
  if (!context || !trackProgress) return;

  const variants = new Set(createTrackVariants(trackProgress.trackId));
  if (trackDoc) {
    const aliases = buildTrackAliases(trackDoc);
    aliases.forEach((alias) => {
      variants.add(alias);
      if (!context.aliasMap.has(alias)) {
        context.aliasMap.set(alias, trackDoc);
      }
    });
  }

  variants.forEach((alias) => {
    context.progressMap.set(alias, { trackProgress, track: trackDoc || null });
  });
};

const prepareTrackMatchingContext = async (progress) => {
  const tracks = await Track.find({ status: 'active' }).lean();
  const aliasMap = new Map();

  tracks.forEach((track) => {
    buildTrackAliases(track).forEach((alias) => {
      if (!aliasMap.has(alias)) aliasMap.set(alias, track);
    });
  });

  const context = {
    tracks,
    aliasMap,
    progressMap: new Map(),
  };

  const trackProgressList = Array.isArray(progress?.tracksProgress)
    ? progress.tracksProgress
    : [];

  trackProgressList.forEach((tp) => {
    if (!tp) return;

    let trackDoc = null;
    const variants = createTrackVariants(tp.trackId);
    for (const variant of variants) {
      if (aliasMap.has(variant)) {
        trackDoc = aliasMap.get(variant);
        break;
      }
    }

    if (!trackDoc && tp.trackId) {
      trackDoc = tracks.find(
        (track) => String(track._id) === String(tp.trackId)
      );
    }

    attachTrackProgressToContext(context, tp, trackDoc || null);
  });

  return context;
};

const findTrackProgressByIdentifier = (context, identifier) => {
  if (!context || identifier === undefined || identifier === null) {
    return { trackProgress: null, track: null };
  }

  const variants = createTrackVariants(identifier);
  for (const variant of variants) {
    if (context.progressMap.has(variant)) {
      return context.progressMap.get(variant);
    }
  }

  for (const variant of variants) {
    if (context.aliasMap.has(variant)) {
      const trackDoc = context.aliasMap.get(variant);
      const aliases = buildTrackAliases(trackDoc);
      for (const alias of aliases) {
        if (context.progressMap.has(alias)) {
          return {
            trackProgress: context.progressMap.get(alias).trackProgress,
            track: trackDoc,
          };
        }
      }
    }
  }

  return { trackProgress: null, track: null };
};

const ensureTrackProgressEntry = (progress, context, identifier, defaults = {}) => {
  const match = findTrackProgressByIdentifier(context, identifier);
  let { trackProgress, track } = match;

  if (!track && context) {
    const variants = createTrackVariants(identifier);
    for (const variant of variants) {
      if (context.aliasMap.has(variant)) {
        track = context.aliasMap.get(variant);
        break;
      }
    }
    if (!track) {
      track = context.tracks.find((t) =>
        createTrackVariants(t._id).some((alias) => variants.includes(alias))
      );
    }
    if (!track) {
      track = context.tracks.find((t) =>
        createTrackVariants(t.trackId).some((alias) => variants.includes(alias))
      );
    }
  }

  if (!trackProgress) {
    if (!progress.tracksProgress) progress.tracksProgress = [];
    trackProgress = {
      trackId: track ? track._id : identifier,
      status: defaults.status || 'unlocked',
      modulesProgress: defaults.modulesProgress || [],
      startedAt: defaults.startedAt || new Date(),
    };
    progress.tracksProgress.push(trackProgress);
    attachTrackProgressToContext(context, trackProgress, track || null);
  }

  return { trackProgress, track };
};

module.exports = {
  createTrackVariants,
  buildTrackAliases,
  prepareTrackMatchingContext,
  findTrackProgressByIdentifier,
  ensureTrackProgressEntry,
  attachTrackProgressToContext,
  uniqueModuleTrackVariants,
};
