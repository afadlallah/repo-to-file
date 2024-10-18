import { NextResponse } from 'next/server'
import axios from 'axios'

interface FileEntry {
  path: string
  type: 'blob' | 'tree'
  object: {
    text?: string
  }
}

async function fetchAllFiles(owner: string, repo: string, path: string = ''): Promise<FileEntry[]> {
  const query = `
    query ($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  text
                }
              }
            }
          }
        }
      }
    }
  `

  const variables = {
    owner,
    name: repo,
    expression: `HEAD:${path}`
  }

  const response = await axios.post(
    'https://api.github.com/graphql',
    { query, variables },
    {
      headers: { Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}` }
    }
  )

  const entries = response.data.data.repository.object.entries
  let files: FileEntry[] = []

  for (const entry of entries) {
    if (entry.type === 'blob') {
      files.push({
        path: path ? `${path}/${entry.name}` : entry.name,
        ...entry
      })
    } else if (entry.type === 'tree') {
      const subFiles = await fetchAllFiles(owner, repo, path ? `${path}/${entry.name}` : entry.name)
      files = files.concat(subFiles)
    }
  }

  return files
}

export async function POST(request: Request) {
  const { name, owner } = await request.json()

  try {
    const files = await fetchAllFiles(owner, name)
    return NextResponse.json({ files })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: `Error fetching data from GitHub: ${error.message}` }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'An unknown error occurred while fetching data from GitHub' }, { status: 500 })
    }
  }
}
