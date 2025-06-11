# Additional setup

This project expects two folders at the repository root:

```
data/   - JSON archives used by the interface
videos/ - MP4 video files referenced by the scripts
```

The original files live in the `OLD/` directory after the site restructure. To run the site, copy the contents from there:

1. Copy `OLD/data/*` into the new `data/` folder.
2. Copy or link your video collection into `videos/`. A helper script `OLD/link-videos.sh` demonstrates how to link the directory used during development (`/Users/paulpaturel/Documents/PAUL/01_ECAL/S_V/06_DIPLOME/VideoExports`).

Once these folders contain the required files, open `OLD/index.html` in a browser to launch the application.
