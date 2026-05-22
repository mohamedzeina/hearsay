'use client';

import { useActionState, useEffect } from 'react';
import {
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FormButton from '../common/form-button';
import FormError from '@/components/common/form-error';
import CharCounter from '@/components/common/char-counter';
import { PrimaryButton } from '@/components/common/primary-button';
import * as actions from '@/actions';
import { inputClassNames } from '@/lib/form-classes';
import { TOPIC_DESCRIPTION } from '@/lib/form-limits';
import { IconPlus } from '@/components/icons';
import {
  fieldError,
  formMessage,
  INITIAL_ACTION_STATE,
} from '@/lib/types';
import { useSignInPrompt } from '@/components/auth/signin-prompt';
import { useDraft } from '@/lib/use-draft';

export default function TopicCreateForm() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const session = useSession();
  const signInPrompt = useSignInPrompt();
  const router = useRouter();
  const nameDraft = useDraft('topic:name');
  const descDraft = useDraft('topic:description');
  const [formState, action] = useActionState(
    actions.createTopic,
    INITIAL_ACTION_STATE
  );

  useEffect(() => {
    if (formState.ok) {
      nameDraft.clear();
      descDraft.clear();
      if (formState.redirectTo) router.push(formState.redirectTo);
    }
  }, [formState, router, nameDraft, descDraft]);

  const handleTrigger = () => {
    if (session.status !== 'authenticated') {
      signInPrompt.open('Sign in to start a topic.');
      return;
    }
    onOpen();
  };

  return (
    <>
      <PrimaryButton type="button" onClick={handleTrigger} fullWidth>
        <IconPlus
          strokeWidth={2.4}
          className="w-4 h-4 transition-transform duration-300 motion-reduce:transition-none group-hover:rotate-90"
        />
        Create a topic
      </PrimaryButton>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        size="md"
        scrollBehavior="inside"
        classNames={{
          base: 'rounded-2xl border border-rule bg-surface shadow-lift-lg',
          backdrop: 'bg-ink/40 backdrop-blur-sm',
          closeButton: 'top-3 right-3 text-ink-2 hover:bg-cream-2',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form action={action}>
              <ModalBody className="p-0">
                <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-rule pr-12">
                  <div className="w-10 h-10 rounded-xl bg-persimmon-soft text-persimmon-deep flex items-center justify-center shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <path d="M3 7h18M3 12h18M3 17h12" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-lg text-ink leading-tight">
                      Start a topic
                    </h3>
                    <p className="text-xs text-ink-2 mt-0.5 leading-snug">
                      A room for one subject. Lowercase letters and dashes
                      only.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 px-6 py-5">
                  <Input
                    autoFocus
                    name="name"
                    label="Slug"
                    labelPlacement="outside"
                    placeholder="e.g. cooking-tips"
                    value={nameDraft.value}
                    onValueChange={nameDraft.setValue}
                    isInvalid={!!fieldError(formState, 'name')}
                    errorMessage={fieldError(formState, 'name')?.join(', ')}
                    classNames={inputClassNames}
                  />
                  <Textarea
                    name="description"
                    label="Description"
                    labelPlacement="outside"
                    placeholder="What is this topic about?"
                    minRows={3}
                    value={descDraft.value}
                    onValueChange={descDraft.setValue}
                    isInvalid={!!fieldError(formState, 'description')}
                    errorMessage={fieldError(formState, 'description')?.join(', ')}
                    classNames={inputClassNames}
                  />
                  <div className="flex items-center justify-end -mt-2">
                    <CharCounter
                      current={descDraft.value.length}
                      min={TOPIC_DESCRIPTION.min}
                      max={TOPIC_DESCRIPTION.max}
                    />
                  </div>

                  <FormError message={formMessage(formState)} />
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-rule bg-cream-2/40">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 rounded-full text-sm font-medium text-ink-2 hover:text-ink hover:bg-cream-2 transition-colors duration-150 motion-reduce:transition-none"
                  >
                    Cancel
                  </button>
                  <FormButton fullWidth={false}>Create topic</FormButton>
                </div>
              </ModalBody>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
