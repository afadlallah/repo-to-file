'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaCheck, FaCopy, FaDownload, FaGithub, FaSpinner } from 'react-icons/fa'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useToast } from '@/hooks/use-toast'
import { getExtensionsForType, shouldExclude } from '@/lib/file-extensions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/toaster'

interface FileEntry {
  path: string
  type: 'blob' | 'tree'
  object: {
    text?: string
  }
}

export default function Component() {
  const [repoUrl, setRepoUrl] = useState('')
  const [excludeTypes, setExcludeTypes] = useState({
    archives: true,
    binaryFiles: true,
    databaseFiles: true,
    dotFiles: true,
    javaFiles: true,
    mediaFiles: true,
    microsoftOfficeFiles: true,
    pythonFiles: true,
    virtualMachineFiles: true,
    others: true
  })
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  const [convertedContent, setConvertedContent] = useState('')
  const { toast } = useToast()
  const [copiedState, setCopiedState] = useState(false)
  const [downloadedState, setDownloadedState] = useState(false)
  const [showTokenWarning, setShowTokenWarning] = useState(false)

  const { data: tokenCheck } = useQuery({
    queryKey: ['githubTokenCheck'],
    queryFn: async () => {
      const response = await fetch('/api/checkGithubToken')
      return response.json()
    }
  })

  useEffect(() => {
    setShowTokenWarning(tokenCheck?.hasToken === false)
  }, [tokenCheck])

  const handleExcludeChange = (type: keyof typeof excludeTypes) => {
    setExcludeTypes((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const handleConvert = async () => {
    setIsConverting(true)
    setError('')

    const excludedTypes = Object.entries(excludeTypes)
      .filter(([, value]) => value)
      .map(([key]) => key)

    try {
      const response = await fetch('/api/processRepo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoUrl.split('/')[3],
          name: repoUrl.split('/')[4]
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'An error occurred while fetching the repository data.')
      }

      const data = await response.json()
      const content = processRepositoryData(data.files, excludedTypes)
      setConvertedContent(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsConverting(false)
    }
  }

  const processRepositoryData = (files: FileEntry[], excludedTypes: string[]) => {
    let content = ''
    files.forEach((file) => {
      if (file.type === 'blob' && file.object.text) {
        const fileName = file.path.split('/').pop() || ''
        if (!shouldExclude(fileName, excludedTypes)) {
          content += `\n${'='.repeat(80)}\n// FILE: ${file.path}\n${'='.repeat(80)}\n\n${file.object.text.trim()}\n\n`
        }
      }
    })
    return content.trim() // This will remove any trailing newlines
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(convertedContent)
    toast({
      title: 'Copied to Clipboard',
      description: 'The repo content has been copied to your clipboard.',
      duration: 3000
    })
    setCopiedState(true)
    setTimeout(() => setCopiedState(false), 2000)
  }, [convertedContent, toast])

  const handleDownload = useCallback(() => {
    const blob = new Blob([convertedContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repoUrl.split('/').pop()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: 'Downloaded',
      description: `${repoUrl.split('/').pop()}.txt has been downloaded.`,
      duration: 3000
    })
    setDownloadedState(true)
    setTimeout(() => setDownloadedState(false), 2000)
  }, [convertedContent, repoUrl, toast])

  const handleCodeClick = useCallback((e: React.MouseEvent<HTMLPreElement>) => {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(e.currentTarget)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  return (
    <div className='flex h-screen flex-col items-center overflow-hidden p-4'>
      <div className='mx-auto w-full max-w-4xl shrink-0 space-y-4'>
        {showTokenWarning && (
          <Alert variant='destructive'>
            <AlertTitle className='font-bold'>GitHub Access Token Not Set</AlertTitle>
            <AlertDescription>Please set your GitHub access token in the .env.local file to avoid API rate limit issues.</AlertDescription>
          </Alert>
        )}
        <Card className='shadow-xl'>
          <CardHeader className='text-center'>
            <CardTitle className='flex items-center justify-center gap-2 text-3xl font-bold'>
              <FaGithub className='size-8' />
              GitHub Repo to File
            </CardTitle>
            <CardDescription className='text-lg'>Convert your GitHub repo to a text file for LLM context</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium' htmlFor='repo-url'>
                Repo URL:
              </Label>
              <Input
                id='repo-url'
                placeholder='https://github.com/username/repo'
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>File Types to Exclude:</Label>
              <div className='grid grid-cols-3 gap-4'>
                {Object.entries(excludeTypes).map(([type, checked]) => (
                  <HoverCard key={type}>
                    <HoverCardTrigger asChild>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          checked={checked}
                          id={type}
                          onCheckedChange={() => handleExcludeChange(type as keyof typeof excludeTypes)}
                        />
                        <Label className='text-sm capitalize' htmlFor={type}>
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className='w-auto bg-primary text-white'>
                      <div className='text-xs'>{getExtensionsForType(type).join(', ')}</div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
            <Button
              className='w-full rounded-lg px-4 py-2 font-semibold text-white transition duration-300 ease-in-out'
              disabled={isConverting}
              onClick={handleConvert}
            >
              {isConverting ? (
                <>
                  <FaSpinner className='mr-2 size-4 animate-spin' />
                  Converting...
                </>
              ) : (
                'Convert Repo'
              )}
            </Button>
            {error && <p className='text-center text-red-500'>{error}</p>}
          </CardContent>
        </Card>
      </div>
      {convertedContent && (
        <Card className='mt-4 flex max-w-4xl grow flex-col overflow-hidden shadow-xl'>
          <CardHeader className='flex shrink-0 flex-row items-center justify-between'>
            <CardTitle>Converted Repo: {repoUrl.split('/').pop()}</CardTitle>
            <div className='space-x-2'>
              <Button size='icon' variant='outline' onClick={handleCopy}>
                {copiedState ? <FaCheck className='size-4 text-green-500' /> : <FaCopy className='size-4' />}
              </Button>
              <Button size='icon' variant='outline' onClick={handleDownload}>
                {downloadedState ? <FaCheck className='size-4 text-green-500' /> : <FaDownload className='size-4' />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className='grow overflow-hidden'>
            <div className='h-full overflow-auto rounded'>
              <SyntaxHighlighter
                customStyle={{
                  cursor: 'text',
                  fontSize: '0.875rem',
                  lineHeight: '1.5rem',
                  margin: 0,
                  maxHeight: '100%',
                  overflow: 'auto',
                  padding: '1rem 1rem 1rem 0rem',
                  fontFamily: 'var(--font-ubuntu-mono)'
                }}
                language='typescript'
                lineNumberStyle={{ userSelect: 'none' }}
                showLineNumbers={true}
                style={vscDarkPlus}
                wrapLines={true}
                onClick={handleCodeClick}
              >
                {convertedContent}
              </SyntaxHighlighter>
            </div>
          </CardContent>
        </Card>
      )}
      <Toaster />
    </div>
  )
}
