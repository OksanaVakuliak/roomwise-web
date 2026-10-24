import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NoticeStack } from './NoticeStack';

describe('NoticeStack', () => {
  it('keeps every notice in the document', () => {
    render(
      <NoticeStack>
        <p>First</p>
        <p>Second</p>
      </NoticeStack>,
    );
    expect(screen.getByText('First')).toBeVisible();
    expect(screen.getByText('Second')).toBeVisible();
  });
});
