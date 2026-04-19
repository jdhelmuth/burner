import type { BurnerDraft } from "@burner/core";

export const demoDraft: BurnerDraft = {
  title: "Burned After Midnight",
  senderName: "Skye",
  note: "Track 4 is the one I was too embarrassed to send in 2004.",
  revealMode: "verified-or-timed",
  coverImageUrl:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  tracks: [
    {
      provider: "spotify",
      providerTrackId: "track-1",
      title: "Satellite Crush",
      artist: "Neon Weekend",
      albumName: "Mall Parking Lot Hearts",
      albumArtUrl:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
      handoffUri: "spotify:track:demo-1",
      externalUrl: "https://open.spotify.com/track/demo-1",
    },
    {
      provider: "appleMusic",
      providerTrackId: "track-2",
      title: "Static on the Line",
      artist: "The Burners",
      albumName: "CD-R Deluxe",
      albumArtUrl:
        "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?auto=format&fit=crop&w=600&q=80",
      handoffUri: "https://music.apple.com/us/song/demo-2",
      externalUrl: "https://music.apple.com/us/song/demo-2",
    },
    {
      provider: "youtubeMusic",
      providerTrackId: "track-3",
      title: "Dial-Up Kisses",
      artist: "Snowglobe Arcade",
      albumName: "Suburban Afterglow",
      albumArtUrl:
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80",
      externalUrl: "https://music.youtube.com/watch?v=demo-3",
      handoffUri: "https://music.youtube.com/watch?v=demo-3",
    },
  ],
};
