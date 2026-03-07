import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, url } = body

    // Extract video ID from URL if provided, or use direct videoId
    let targetVideoId = videoId

    if (!targetVideoId && url) {
      // Extract video ID from various YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) {
          targetVideoId = match[1]
          break
        }
      }
    }

    if (!targetVideoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL or video ID' },
        { status: 400 }
      )
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(targetVideoId)

    // Combine transcript segments into full text
    const fullText = transcript
      .map((segment) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Calculate word count (approximate for mixed languages)
    const wordCount = fullText.length > 0 ? fullText.split(/\s+/).length : 0

    return NextResponse.json({
      success: true,
      videoId: targetVideoId,
      transcript: fullText,
      segments: transcript,
      wordCount,
      metadata: {
        duration: transcript.length > 0 ? transcript[transcript.length - 1].offset + transcript[transcript.length - 1].duration : 0,
        segmentCount: transcript.length,
      },
    })
  } catch (error) {
    console.error('YouTube transcript error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Could not find')) {
        return NextResponse.json(
          { error: 'Transcript not available for this video. The video may not have captions or they may be disabled.' },
          { status: 404 }
        )
      }
      if (error.message.includes('Video unavailable')) {
        return NextResponse.json(
          { error: 'Video is unavailable or private' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch transcript. Please check the video URL and try again.' },
      { status: 500 }
    )
  }
}
