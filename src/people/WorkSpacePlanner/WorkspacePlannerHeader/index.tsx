import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { EuiText, EuiPopover, EuiCheckboxGroup } from '@elastic/eui';
import MaterialIcon from '@material/react-material-icon';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { Workspace, Feature, BountyCard, BountyCardStatus } from 'store/interface';
import { debounce } from 'lodash';
import { useStores } from '../../../store';
import { userCanManageBounty } from '../../../helpers';
import { PostModal } from '../../widgetViews/postBounty/PostModal';
import { colors } from '../../../config';
import { useBountyCardStore } from '../../../store/bountyCard';
import {
  FillContainer,
  ImageContainer,
  CompanyNameAndLink,
  CompanyLabel,
  UrlButtonContainer,
  UrlButton,
  RightHeader,
  CompanyDescription,
  Button,
  Filters,
  FiltersRight,
  NewStatusContainer,
  StatusContainer,
  InnerContainer,
  EuiPopOverCheckbox,
  FilterCount,
  Formatter
} from '../../../pages/tickets/workspace/workspaceHeader/WorkspaceHeaderStyles';
import { Header, Leftheader } from '../../../pages/tickets/style';
import addBounty from '../../../pages/tickets/workspace/workspaceHeader/Icons/addBounty.svg';
import websiteIcon from '../../../pages/tickets/workspace/workspaceHeader/Icons/websiteIcon.svg';
import githubIcon from '../../../pages/tickets/workspace/workspaceHeader/Icons/githubIcon.svg';
import { SearchBar } from '../../../components/common';

const color = colors['light'];

interface WorkspacePlannerHeaderProps {
  workspace_uuid: string;
  workspaceData: Workspace & {
    features?: Feature[];
  };
  filterToggle: boolean;
  setFilterToggle: (a: boolean) => void;
}

interface FeatureOption {
  label: string;
  id: string;
}

const ClearButton = styled.button`
  color: ${colors.light.primaryColor};
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  margin-left: 8px;

  &:hover {
    text-decoration: underline;
  }
`;

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

export const WorkspacePlannerHeader = observer(
  ({
    workspace_uuid,
    workspaceData,
    filterToggle,
    setFilterToggle
  }: WorkspacePlannerHeaderProps) => {
    const { main, ui } = useStores();
    const [isPostBountyModalOpen, setIsPostBountyModalOpen] = useState(false);
    const [canPostBounty, setCanPostBounty] = useState(false);
    const [isFeaturePopoverOpen, setIsFeaturePopoverOpen] = useState<boolean>(false);
    const [isPhasePopoverOpen, setIsPhasePopoverOpen] = useState<boolean>(false);
    const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState<boolean>(false);
    const bountyCardStore = useBountyCardStore(workspace_uuid);

    const checkUserPermissions = useCallback(async () => {
      const hasPermission = await userCanManageBounty(workspace_uuid, ui.meInfo?.pubkey, main);
      setCanPostBounty(hasPermission);
    }, [workspace_uuid, ui.meInfo, main]);

    useEffect(() => {
      checkUserPermissions();
    }, [checkUserPermissions]);

    const handlePostBountyClick = () => {
      setIsPostBountyModalOpen(true);
    };

    const handleWebsiteButton = (websiteUrl: string) => {
      window.open(websiteUrl, '_blank');
    };

    const handleGithubButton = (githubUrl: string) => {
      window.open(githubUrl, '_blank');
    };

    const { name, img, description, website, github } = workspaceData || {};
    const selectedWidget = 'bounties';

    const onFeatureButtonClick = (): void => {
      setIsFeaturePopoverOpen((isPopoverOpen: boolean) => !isPopoverOpen);
    };

    const onPhaseButtonClick = (): void => {
      setIsPhasePopoverOpen((isPopoverOpen: boolean) => !isPopoverOpen);
    };

    const onStatusButtonClick = (): void => {
      setIsStatusPopoverOpen((isPopoverOpen: boolean) => !isPopoverOpen);
    };

    const closeFeaturePopover = () => setIsFeaturePopoverOpen(false);
    const closePhasePopover = () => setIsPhasePopoverOpen(false);
    const closeStatusPopover = () => setIsStatusPopoverOpen(false);

    const getFeatureOptions = (): FeatureOption[] => {
      const options: FeatureOption[] = [];
      const uniqueFeatures = new Map<string, { name: string; count: number }>();
      let noFeatureCount = 0;

      bountyCardStore.bountyCards.forEach((card: BountyCard) => {
        if (card.features?.uuid && card.features?.name) {
          const existing = uniqueFeatures.get(card.features.uuid);
          if (existing) {
            existing.count++;
          } else {
            uniqueFeatures.set(card.features.uuid, {
              name: card.features.name,
              count: 1
            });
          }
        } else {
          noFeatureCount++;
        }
      });

      uniqueFeatures.forEach((value: { name: string; count: number }, uuid: string) => {
        options.push({
          label: `${value.name} (${value.count})`,
          id: uuid
        });
      });

      options.sort((a: FeatureOption, b: FeatureOption) => a.label.localeCompare(b.label));

      if (noFeatureCount > 0) {
        options.unshift({
          label: `No Feature (${noFeatureCount})`,
          id: 'no-feature'
        });
      }

      return options;
    };

    const isPhaseFilterDisabled =
      bountyCardStore.selectedFeatures.length === 0 ||
      (bountyCardStore.selectedFeatures.length === 1 &&
        bountyCardStore.selectedFeatures.includes('no-feature'));

    const debouncedSearch = useMemo(
      () =>
        debounce((text: string) => {
          if (text.length === 0 || text.length >= MIN_SEARCH_LENGTH) {
            bountyCardStore.setSearchText(text);
            setFilterToggle(!filterToggle);
          }
        }, SEARCH_DEBOUNCE_MS),
      [bountyCardStore, filterToggle, setFilterToggle]
    );

    const handleSearch = useCallback(
      (e: React.ChangeEvent<HTMLInputElement> | string) => {
        const searchText = typeof e === 'string' ? e : e.target.value;
        debouncedSearch(searchText);
      },
      [debouncedSearch]
    );

    const handleKeyUp = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Backspace' || e.key === 'Delete') && !e.currentTarget.value) {
          bountyCardStore.clearSearch();
          setFilterToggle(!filterToggle);
          return;
        }

        if (e.key === 'Enter') {
          debouncedSearch.cancel();
          const searchText = e.currentTarget.value;
          bountyCardStore.setSearchText(searchText);
          setFilterToggle(!filterToggle);
        }
      },
      [bountyCardStore, debouncedSearch, filterToggle, setFilterToggle]
    );

    return (
      <>
        <FillContainer>
          <Header>
            <Leftheader>
              {img && <ImageContainer src={img} width="72px" height="72px" alt="workspace icon" />}
              <CompanyNameAndLink>
                <CompanyLabel>{name}</CompanyLabel>
                <UrlButtonContainer data-testid="url-button-container">
                  {website && (
                    <UrlButton onClick={() => handleWebsiteButton(website)}>
                      <img src={websiteIcon} alt="" />
                      Website
                    </UrlButton>
                  )}
                  {github && (
                    <UrlButton onClick={() => handleGithubButton(github)}>
                      <img src={githubIcon} alt="" />
                      Github
                    </UrlButton>
                  )}
                </UrlButtonContainer>
              </CompanyNameAndLink>
            </Leftheader>
            <RightHeader>
              <CompanyDescription>{description}</CompanyDescription>
              {canPostBounty && (
                <Button onClick={handlePostBountyClick}>
                  <img src={addBounty} alt="" />
                  Post a Bounty
                </Button>
              )}
            </RightHeader>
          </Header>
        </FillContainer>

        <FillContainer>
          <Filters>
            <FiltersRight>
              <NewStatusContainer>
                <EuiPopover
                  button={
                    <StatusContainer onClick={onFeatureButtonClick} color={color}>
                      <InnerContainer>
                        <EuiText
                          className="statusText"
                          style={{
                            color: isFeaturePopoverOpen ? color.grayish.G10 : ''
                          }}
                        >
                          Feature
                        </EuiText>
                        <Formatter>
                          {bountyCardStore.selectedFeatures.length > 0 && (
                            <FilterCount color={color}>
                              <EuiText className="filterCountText">
                                {bountyCardStore.selectedFeatures.length}
                              </EuiText>
                            </FilterCount>
                          )}
                        </Formatter>
                        <div className="filterStatusIconContainer">
                          <MaterialIcon
                            className="materialStatusIcon"
                            icon={`${
                              isFeaturePopoverOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'
                            }`}
                            style={{
                              color: isFeaturePopoverOpen ? color.grayish.G10 : ''
                            }}
                          />
                        </div>
                      </InnerContainer>
                    </StatusContainer>
                  }
                  panelStyle={{
                    border: 'none',
                    boxShadow: `0px 1px 20px ${color.black90}`,
                    background: `${color.pureWhite}`,
                    borderRadius: '0px 0px 6px 6px',
                    maxWidth: '140px',
                    minHeight: '160px',
                    marginTop: '0px',
                    marginLeft: '20px'
                  }}
                  isOpen={isFeaturePopoverOpen}
                  closePopover={closeFeaturePopover}
                  panelClassName="yourClassNameHere"
                  panelPaddingSize="none"
                  anchorPosition="downLeft"
                >
                  <div style={{ display: 'flex', flex: 'row' }}>
                    <EuiPopOverCheckbox className="CheckboxOuter" color={color}>
                      <EuiCheckboxGroup
                        options={getFeatureOptions()}
                        idToSelectedMap={bountyCardStore.selectedFeatures.reduce(
                          (acc: { [key: string]: boolean }, featureId: string) => {
                            acc[featureId] = true;
                            return acc;
                          },
                          {}
                        )}
                        onChange={(id: string) => {
                          bountyCardStore.toggleFeature(id);
                          setFilterToggle(!filterToggle);
                        }}
                      />
                      {bountyCardStore.selectedFeatures.length > 0 && (
                        <div
                          style={{
                            padding: '8px 16px',
                            borderTop: `1px solid ${color.grayish.G800}`
                          }}
                        >
                          <ClearButton
                            onClick={(e: React.MouseEvent): void => {
                              e.stopPropagation();
                              bountyCardStore.clearAllFilters();
                              setFilterToggle(!filterToggle);
                            }}
                          >
                            Clear All
                          </ClearButton>
                        </div>
                      )}
                    </EuiPopOverCheckbox>
                  </div>
                </EuiPopover>
              </NewStatusContainer>

              <NewStatusContainer>
                <EuiPopover
                  button={
                    <StatusContainer
                      onClick={isPhaseFilterDisabled ? undefined : onPhaseButtonClick}
                      color={color}
                      style={{
                        opacity: isPhaseFilterDisabled ? 0.5 : 1,
                        cursor: isPhaseFilterDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <InnerContainer>
                        <EuiText className="statusText">Phase</EuiText>
                        <Formatter>
                          {bountyCardStore.selectedPhases.length > 0 && (
                            <FilterCount color={color}>
                              <EuiText className="filterCountText">
                                {bountyCardStore.selectedPhases.length}
                              </EuiText>
                            </FilterCount>
                          )}
                        </Formatter>
                        <MaterialIcon
                          icon={isPhasePopoverOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                        />
                      </InnerContainer>
                    </StatusContainer>
                  }
                  isOpen={isPhasePopoverOpen && !isPhaseFilterDisabled}
                  closePopover={closePhasePopover}
                  panelStyle={{
                    border: 'none',
                    boxShadow: `0px 1px 20px ${color.black90}`,
                    background: `${color.pureWhite}`,
                    borderRadius: '0px 0px 6px 6px',
                    maxWidth: '140px',
                    minHeight: '160px',
                    marginTop: '0px',
                    marginLeft: '20px'
                  }}
                  panelClassName="yourClassNameHere"
                  panelPaddingSize="none"
                  anchorPosition="downLeft"
                >
                  <div style={{ display: 'flex', flex: 'row' }}>
                    <EuiPopOverCheckbox className="CheckboxOuter" color={color}>
                      <EuiCheckboxGroup
                        options={bountyCardStore.availablePhases.map((phase: any) => ({
                          label: phase.name,
                          id: phase.uuid
                        }))}
                        idToSelectedMap={bountyCardStore.selectedPhases.reduce(
                          (acc: { [key: string]: boolean }, phaseId: string) => {
                            acc[phaseId] = true;
                            return acc;
                          },
                          {}
                        )}
                        onChange={(id: string) => {
                          bountyCardStore.togglePhase(id);
                          setFilterToggle(!filterToggle);
                        }}
                      />
                      {bountyCardStore.selectedPhases.length > 0 && (
                        <div
                          style={{
                            padding: '8px 16px',
                            borderTop: `1px solid ${color.grayish.G800}`
                          }}
                        >
                          <ClearButton
                            onClick={(e: React.MouseEvent): void => {
                              e.stopPropagation();
                              bountyCardStore.clearPhaseFilters();
                              setFilterToggle(!filterToggle);
                            }}
                          >
                            Clear All
                          </ClearButton>
                        </div>
                      )}
                    </EuiPopOverCheckbox>
                  </div>
                </EuiPopover>
              </NewStatusContainer>

              <NewStatusContainer>
                <EuiPopover
                  button={
                    <StatusContainer onClick={onStatusButtonClick} color={color}>
                      <InnerContainer>
                        <EuiText className="statusText">Status</EuiText>
                        <Formatter>
                          {bountyCardStore.selectedStatuses.length > 0 && (
                            <FilterCount color={color}>
                              <EuiText className="filterCountText">
                                {bountyCardStore.selectedStatuses.length}
                              </EuiText>
                            </FilterCount>
                          )}
                        </Formatter>
                        <MaterialIcon
                          icon={isStatusPopoverOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                        />
                      </InnerContainer>
                    </StatusContainer>
                  }
                  panelStyle={{
                    border: 'none',
                    boxShadow: `0px 1px 20px ${color.black90}`,
                    background: `${color.pureWhite}`,
                    borderRadius: '0px 0px 6px 6px',
                    maxWidth: '140px',
                    minHeight: '160px',
                    marginTop: '0px',
                    marginLeft: '20px'
                  }}
                  isOpen={isStatusPopoverOpen}
                  closePopover={closeStatusPopover}
                  panelClassName="yourClassNameHere"
                  panelPaddingSize="none"
                  anchorPosition="downLeft"
                >
                  <div style={{ display: 'flex', flex: 'row' }}>
                    <EuiPopOverCheckbox className="CheckboxOuter" color={color}>
                      <EuiCheckboxGroup
                        options={[
                          { label: 'TODO', id: 'TODO' },
                          { label: 'IN_PROGRESS', id: 'IN_PROGRESS' },
                          { label: 'IN_REVIEW', id: 'IN_REVIEW' },
                          { label: 'COMPLETED', id: 'COMPLETED' },
                          { label: 'PAID', id: 'PAID' }
                        ]}
                        idToSelectedMap={bountyCardStore.selectedStatuses.reduce(
                          (acc: any, status: any) => ({ ...acc, [status]: true }),
                          {}
                        )}
                        onChange={(id: string) => {
                          bountyCardStore.toggleStatus(id as BountyCardStatus);
                          setFilterToggle(!filterToggle);
                        }}
                      />
                      {bountyCardStore.selectedStatuses.length > 0 && (
                        <div
                          style={{
                            padding: '8px 16px',
                            borderTop: `1px solid ${color.grayish.G800}`
                          }}
                        >
                          <ClearButton
                            onClick={(e: React.MouseEvent): void => {
                              e.stopPropagation();
                              bountyCardStore.clearStatusFilters();
                              setFilterToggle(!filterToggle);
                            }}
                          >
                            Clear All
                          </ClearButton>
                        </div>
                      )}
                    </EuiPopOverCheckbox>
                  </div>
                </EuiPopover>
              </NewStatusContainer>

              <SearchBar
                name="search"
                type="search"
                placeholder="Search tickets..."
                value={bountyCardStore.searchText}
                onChange={handleSearch}
                onKeyUp={handleKeyUp}
                borderRadius={'6px'}
                width={'384px'}
                height={'40px'}
                marginLeft={'20px'}
                color={color.grayish.G950}
                TextColor={color.grayish.G100}
                TextColorHover={color.grayish.G50}
                border={`1px solid ${color.grayish.G600}`}
                borderHover={`1px solid ${color.grayish.G400}`}
                borderActive={`1px solid ${color.light_blue100}`}
                iconColor={color.grayish.G300}
                iconColorHover={color.grayish.G50}
              />
            </FiltersRight>
          </Filters>
        </FillContainer>

        <PostModal
          widget={selectedWidget}
          isOpen={isPostBountyModalOpen}
          onClose={() => setIsPostBountyModalOpen(false)}
        />
      </>
    );
  }
);
