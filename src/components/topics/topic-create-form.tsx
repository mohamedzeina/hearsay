'use client';

import { useFormState } from 'react-dom';
import {
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@nextui-org/react';
import FormButton from '../common/formButton';
import FormError from '@/components/common/form-error';
import * as actions from '@/actions';
import { inputClassNames } from '@/lib/form-classes';
import { IconPlus } from '@/components/icons';

export default function TopicCreateForm() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formState, action] = useFormState(actions.createTopic, {
    errors: {},
  });

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="group w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon active:scale-[0.99] transition-all duration-200 motion-reduce:transition-none shadow-soft"
      >
        <IconPlus
          strokeWidth={2.4}
          className="w-4 h-4 transition-transform duration-300 motion-reduce:transition-none group-hover:rotate-90"
        />
        Create a topic
      </button>

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
                    isInvalid={!!formState.errors.name}
                    errorMessage={formState.errors.name?.join(', ')}
                    classNames={inputClassNames}
                  />
                  <Textarea
                    name="description"
                    label="Description"
                    labelPlacement="outside"
                    placeholder="What is this topic about?"
                    minRows={3}
                    isInvalid={!!formState.errors.description}
                    errorMessage={formState.errors.description?.join(', ')}
                    classNames={inputClassNames}
                  />

                  <FormError messages={formState.errors._form} />
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
