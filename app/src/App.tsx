import { useCallback, useEffect, useState } from 'react'
import {
  CATEGORIES,
  listFeedback,
  submitFeedback,
  type FeedbackRecord,
} from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const FORM_ID = 'feedback-form'

// Table cells default to whitespace-nowrap, so the prose columns need both a
// wrap and a width cap or they expand until the table scrolls sideways.
const WRAP = 'max-w-[22ch] whitespace-normal'

function countByCategory(records: FeedbackRecord[]) {
  return CATEGORIES.map((category) => ({
    category,
    count: records.filter((record) => record.category === category).length,
  }))
}

function App() {
  const [records, setRecords] = useState<FeedbackRecord[]>([])
  const [listError, setListError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setRecords(await listFeedback())
      setListError(null)
    } catch (error) {
      setListError((error as Error).message)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      await submitFeedback(text)
      // Only clear on success. A rejected submission keeps the text so the
      // person does not retype a paragraph because the model misbehaved.
      setText('')
      setOpen(false)
      await refresh()
    } catch (error) {
      setSubmitError((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="border-b">
        <NavigationMenu className="mx-auto w-full max-w-5xl justify-start px-6 py-2">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/">Feedback dashboard</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {countByCategory(records).map(({ category, count }) => (
            <Card key={category} size="sm">
              <CardHeader>
                <CardDescription>{category}</CardDescription>
                {/* CardTitle's own `group-data-[size=sm]/card:text-sm` would
                    otherwise win over a bare text-3xl, so the override has to
                    carry the same variant. */}
                <CardTitle className="group-data-[size=sm]/card:text-3xl">
                  {count}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next)
              if (!next) setSubmitError(null)
            }}
          >
            {/* Body laid out per the Radix dialog example: DialogHeader,
                FieldGroup and DialogFooter are direct children of DialogContent,
                so DialogContent's own grid spacing applies. The form wraps them
                rather than sitting inside, which is why the submit button needs
                an explicit form= — DialogContent is rendered through a portal,
                so the button is not a DOM descendant of the form. */}
            <form id={FORM_ID} onSubmit={handleSubmit}>
              <DialogTrigger asChild>
                <Button>Submit feedback</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit feedback</DialogTitle>
                  <DialogDescription>
                    The text is sent to a model, which extracts a structured
                    record. This takes a few seconds.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="feedback-text">
                      Your feedback
                    </FieldLabel>
                    {/* Capped so a long submission cannot push the submit
                        button out of the viewport. */}
                    <Textarea
                      id="feedback-text"
                      name="text"
                      className="max-h-48 overflow-y-auto"
                      value={text}
                      disabled={submitting}
                      onChange={(event) => setText(event.target.value)}
                    />
                    {submitError && <FieldError>{submitError}</FieldError>}
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="submit" form={FORM_ID} disabled={submitting}>
                    {submitting ? 'Extracting…' : 'Submit'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
        </div>

        {listError && (
          <p role="alert" className="text-destructive">
            {listError}
          </p>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className={WRAP}>Submitted text</TableHead>
              <TableHead className={WRAP}>Summary</TableHead>
              <TableHead className={WRAP}>Suggested action</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {new Date(record.submittedAt).toLocaleString()}
                </TableCell>
                <TableCell>{record.category}</TableCell>
                <TableCell>{record.sentiment}</TableCell>
                <TableCell>{record.severity}</TableCell>
                {/* The summary is only checkable against the original text, so
                    the two sit next to each other. */}
                <TableCell className={WRAP}>{record.text}</TableCell>
                <TableCell className={WRAP}>{record.summary}</TableCell>
                <TableCell className={WRAP}>{record.suggestedAction}</TableCell>
                <TableCell>{record.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

export default App
