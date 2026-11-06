import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NoticeProvider, NoticeStack } from './NoticeStack';

describe('NoticeStack', () => {
  it('keeps every notice in the document', () => {
    render(
      <NoticeProvider>
        <NoticeStack>
          <p>First</p>
          <p>Second</p>
        </NoticeStack>
      </NoticeProvider>,
    );
    expect(screen.getByText('First')).toBeVisible();
    expect(screen.getByText('Second')).toBeVisible();
  });

  it('puts notices from separate stacks into one container', () => {
    render(
      <NoticeProvider>
        <NoticeStack>
          <p>First</p>
        </NoticeStack>
        <NoticeStack>
          <p>Second</p>
        </NoticeStack>
      </NoticeProvider>,
    );
    expect(screen.getByText('First').parentElement).toBe(
      screen.getByText('Second').parentElement,
    );
  });
});
