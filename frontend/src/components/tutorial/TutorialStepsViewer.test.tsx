/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup, RenderResult, fireEvent} from '../../test-utils';
import TutorialStepsViewer from './TutorialStepsViewer';
import clipMock from '../../__mocks__/clipMock';
import {FocusArea} from '../../state/types';
import {TutorialPageSeparator} from '../../globals/constants';

afterEach(cleanup);

const dispatchMock = jest.fn();
const onPreviousMock = jest.fn();
const onCompleteMock = jest.fn();
const onNextMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  pageIndex: number;
  isFirst: boolean;
  isLast: boolean;
  notes?: string;
  focus?: FocusArea;
}): RenderResult => {
  const notes =
    options.notes ??
    `# Page 1\nPage 1 content\n${TutorialPageSeparator}\n# Page 2\nPage 2 content\n${TutorialPageSeparator}\n# Page 3\nPage 3 content`;
  const pages = notes.split(TutorialPageSeparator, -1);
  const {isFirst, isLast} = options;
  const clip = clipMock({});
  clip.notes = 'Hello';
  return render(
    <TutorialStepsViewer
      isFirst={isFirst}
      isLast={isLast}
      pages={pages}
      pageIndex={options.pageIndex}
      onPrevious={onPreviousMock}
      onComplete={onCompleteMock}
      onNext={onNextMock}
    />,
    {
      selectors: {
        app: {
          getFocus: () => options.focus ?? FocusArea.Navigator,
        },
        project: {
          getProjectInfo: () => ({
            category: 'beginner',
            description: 'tutorial description',
            slug: 'test-project',
            version: '1.0',
            isAuthoringTutorial: false,
          }),
        },
      },
    },
  );
};

describe('<TutorialStepsViewer />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
    onPreviousMock.mockClear();
    onCompleteMock.mockClear();
    onNextMock.mockClear();
  });

  it('renders the main component', () => {
    const element = renderSubject({pageIndex: 0, isFirst: true, isLast: true});
    expect(element).toMatchSnapshot();
    expect(element.getByText('1/3')).toBeVisible();
  });

  it('should handle the next and back button', () => {
    const element = renderSubject({pageIndex: 0, isFirst: true, isLast: true});
    expect(element.getByText('1/3')).toBeVisible();

    element.getByText('Next').click();
    expect(onNextMock).toHaveBeenCalled();

    onNextMock.mockClear();
    element.getByText('Back').click();
    expect(onPreviousMock).toHaveBeenCalled();
  });

  it('should handle the keyboard navigation', () => {
    const element = renderSubject({pageIndex: 0, isFirst: true, isLast: true});

    fireEvent.keyDown(element.baseElement, {key: 'ArrowRight'});
    expect(onNextMock).toHaveBeenCalled();

    onNextMock.mockClear();
    fireEvent.keyDown(element.baseElement, {key: 'ArrowLeft'});
    expect(onPreviousMock).toHaveBeenCalled();
  });

  it('should disable the Back button on first page when isFirst is true', () => {
    const element = renderSubject({pageIndex: 0, isFirst: true, isLast: false});
    const backButton = element.getByText('Back');
    expect(backButton).toHaveClass('disabled');
  });

  it('should not disable the Back button when not on first page', () => {
    const element = renderSubject({
      pageIndex: 1,
      isFirst: false,
      isLast: false,
    });
    const backButton = element.getByText('Back');
    expect(backButton).not.toHaveClass('disabled');
  });

  it('should show "Complete" text on last page', () => {
    const element = renderSubject({pageIndex: 2, isFirst: false, isLast: true});
    expect(element.getByText('Complete')).toBeInTheDocument();
    expect(element.queryByText('Next')).not.toBeInTheDocument();
  });

  it('should show "Next" text on non-last page', () => {
    const element = renderSubject({pageIndex: 0, isFirst: true, isLast: false});
    expect(element.getByText('Next')).toBeInTheDocument();
    expect(element.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('should hide counter when there is only one page', () => {
    const element = renderSubject({
      pageIndex: 0,
      isFirst: true,
      isLast: true,
      notes: '# Single Page\nContent',
    });
    expect(element.queryByText('1/1')).not.toBeInTheDocument();
  });

  it('should call onComplete when reaching the last page', () => {
    renderSubject({pageIndex: 2, isFirst: false, isLast: true});
    expect(onCompleteMock).toHaveBeenCalled();
  });

  it('should not call onComplete when not on the last page', () => {
    renderSubject({pageIndex: 0, isFirst: true, isLast: false});
    expect(onCompleteMock).not.toHaveBeenCalled();
  });

  it('should disable Complete button when authoring tutorial and on last page', () => {
    const notes = `# Page 1\nPage 1 content\n${TutorialPageSeparator}\n# Page 2\nPage 2 content\n${TutorialPageSeparator}\n# Page 3\nPage 3 content`;
    const pages = notes.split(TutorialPageSeparator, -1);
    const clip = clipMock({});
    clip.notes = 'Hello';
    const element = render(
      <TutorialStepsViewer
        isFirst={false}
        isLast={true}
        pages={pages}
        pageIndex={2}
        onPrevious={onPreviousMock}
        onComplete={onCompleteMock}
        onNext={onNextMock}
      />,
      {
        selectors: {
          app: {
            getFocus: () => FocusArea.Navigator,
          },
          project: {
            getProjectInfo: () => ({
              category: 'beginner',
              description: 'tutorial description',
              slug: 'test-project',
              version: '1.0',
              isAuthoringTutorial: true,
            }),
          },
        },
      },
    );
    const completeButton = element.getByText('Complete');
    expect(completeButton).toHaveClass('disabled');
  });

  it('should not call onNext via keyboard when on last page', () => {
    const element = renderSubject({pageIndex: 2, isFirst: false, isLast: true});
    fireEvent.keyDown(element.baseElement, {key: 'ArrowRight'});
    expect(onNextMock).not.toHaveBeenCalled();
  });

  it('should not handle keyboard events when focus is not on Navigator', () => {
    const element = renderSubject({
      pageIndex: 0,
      isFirst: true,
      isLast: false,
      focus: FocusArea.Plot,
    });

    fireEvent.keyDown(element.baseElement, {key: 'ArrowRight'});
    expect(onNextMock).not.toHaveBeenCalled();

    fireEvent.keyDown(element.baseElement, {key: 'ArrowLeft'});
    expect(onPreviousMock).not.toHaveBeenCalled();
  });

  it('should render markdown content', () => {
    const element = renderSubject({pageIndex: 0, isFirst: true, isLast: false});
    const markdownContainer = element.container.querySelector('.markdown');
    expect(markdownContainer).toBeInTheDocument();
    expect(markdownContainer?.innerHTML).toContain('<h1');
  });
});
