// Centralized active media state manager

class ActiveMediaManager {
  constructor() {
    this.currentCell = null;
    this.currentVideo = null;
    this.archiveData = null;
    this.callbacksVideoChange = new Set();
    this.callbacksTimeUpdate = new Set();
    this.fetchCache = new Map();
    this.isLoading = false;
    this.queuedCell = null;
    this.videoListener = null;
    this.videoListenerTarget = null;

    document.addEventListener('highlightchange', e => {
      this._handleHighlightChange(e.detail.cell);
    });
  }

  onVideoChange(cb) {
    this.callbacksVideoChange.add(cb);
    if (this.currentVideo) {
      cb({ video: this.currentVideo, archiveData: this.archiveData, cell: this.currentCell });
    }
    return () => this.callbacksVideoChange.delete(cb);
  }

  onTimeUpdate(cb) {
    this.callbacksTimeUpdate.add(cb);
    return () => this.callbacksTimeUpdate.delete(cb);
  }

  getCurrentVideo() {
    return this.currentVideo;
  }

  getArchiveData() {
    return this.archiveData;
  }

  async _handleHighlightChange(cell) {
    if (this.isLoading) {
      this.queuedCell = cell;
      return;
    }
    this.isLoading = true;
    this._detach();

    if (!cell) {
      this._doneLoading();
      return;
    }

    this.currentCell = cell;
    const video = cell.querySelector('video');
    const archivePath = cell.dataset.archive;
    this.currentVideo = video || null;

    if (archivePath) {
      await this._loadArchive(archivePath);
    } else {
      this.archiveData = null;
    }

    if (this.currentVideo) {
      this._attachVideo(this.currentVideo);
    }

    this._notifyVideoChange();
    this._doneLoading();
    if (this.queuedCell && this.queuedCell !== cell) {
      const next = this.queuedCell;
      this.queuedCell = null;
      this._handleHighlightChange(next);
    }
  }

  async _loadArchive(path) {
    if (this.fetchCache.has(path)) {
      this.archiveData = this.fetchCache.get(path);
      return;
    }
    try {
      const res = await fetch(`data/${path}`);
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      const json = await res.json();
      this.fetchCache.set(path, json);
      this.archiveData = json;
    } catch (err) {
      console.error('activeMedia load error', err);
      this.archiveData = null;
    }
  }

  _attachVideo(video) {
    if (this.videoListenerTarget && this.videoListener) {
      this.videoListenerTarget.removeEventListener('timeupdate', this.videoListener);
    }
    const listener = () => {
      this._notifyTimeUpdate(video.currentTime);
    };
    video.addEventListener('timeupdate', listener);
    this.videoListener = listener;
    this.videoListenerTarget = video;
  }

  _detach() {
    if (this.videoListenerTarget && this.videoListener) {
      this.videoListenerTarget.removeEventListener('timeupdate', this.videoListener);
    }
    this.videoListener = null;
    this.videoListenerTarget = null;
    this.currentVideo = null;
    this.archiveData = null;
  }

  _notifyVideoChange() {
    const info = { video: this.currentVideo, archiveData: this.archiveData, cell: this.currentCell };
    this.callbacksVideoChange.forEach(cb => {
      try { cb(info); } catch (err) { console.error(err); }
    });
  }

  _notifyTimeUpdate(time) {
    this.callbacksTimeUpdate.forEach(cb => {
      try { cb(time); } catch (err) { console.error(err); }
    });
  }

  _doneLoading() {
    this.isLoading = false;
  }
}

export const activeMedia = new ActiveMediaManager();
export { ActiveMediaManager };

