// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the contributor dashboard page.
 */

import { AppConstants } from 'app.constants';
import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { ContributorDashboardConstants, ContributorDashboardTabsDetails } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import { ContributionAndReviewService } from './services/contribution-and-review.service';
import { ContributionOpportunitiesService } from './services/contribution-opportunities.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { LocalStorageService } from 'services/local-storage.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { TranslationTopicService } from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { UserService } from 'services/user.service';
import { QuestionTopicService } from 'pages/exploration-editor-page/translation-tab/services/question-topic.service';

@Component({
  selector: 'contributor-dashboard-page',
  templateUrl: './contributor-dashboard-page.component.html'
})
export class ContributorDashboardPageComponent
  implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  defaultHeaderVisible!: boolean;
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  userInfoIsLoading!: boolean;
  userIsLoggedIn!: boolean;
  userIsReviewer!: boolean;
  userCanReviewTranslationSuggestionsInLanguages!: string[];
  userCanReviewVoiceoverSuggestionsInLanguages!: string[];
  userCanReviewQuestions!: boolean;
  tabsDetails!: ContributorDashboardTabsDetails;
  OPPIA_AVATAR_IMAGE_URL!: string;
  languageCode!: string;
  translationTopicName!: string;
  questionTopicName!: string;
  activeTabName!: string;
  // The following property is set to null when the
  // user is not logged in.
  username: string | null = null;

  constructor(
    private contributionAndReviewService: ContributionAndReviewService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private focusManagerService: FocusManagerService,
    private languageUtilService: LanguageUtilService,
    private localStorageService: LocalStorageService,
    private translationLanguageService: TranslationLanguageService,
    private translationTopicService: TranslationTopicService,
    private questionTopicService: QuestionTopicService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
  ) {}

  onTabClick(activeTabName: string): void {
    this.activeTabName = activeTabName;

    // The setTimeout is required to ensure that focus is applied only
    // after all the functions in main thread have executed.
    if (this.activeTabName === 'translateTextTab') {
      setTimeout(() => {
        this.focusManagerService.setFocusWithoutScroll('selectLangDropDown');
      }, 5);
    }
  }

  provideLanguageForProtractorClass(languageDescription: string): string {
    const lang = languageDescription.split(' ').join('-').toLowerCase();
    return lang.replace(/\(?\)?/g, '');
  }

  onChangeLanguage(languageCode: string): void {
    this.languageCode = languageCode;
    this.translationLanguageService.setActiveLanguageCode(this.languageCode);
    this.localStorageService.updateLastSelectedTranslationLanguageCode(
      this.languageCode);
  }

  showLanguageSelector(): boolean {
    const activeTabDetail = this.tabsDetails[
      this.activeTabName as keyof ContributorDashboardTabsDetails];
    return activeTabDetail.customizationOptions.includes('language');
  }

  onChangeTranslationTopic(topicName: string): void {
    this.translationTopicName = topicName;
    this.translationTopicService.setActiveTopicName(this.translationTopicName);
    this.localStorageService.updateLastSelectedTranslationTopicName(
      this.translationTopicName);
  }

  onChangeQuestionTopic(topicName: string): void {
    this.questionTopicName = topicName;
    this.questionTopicService.setActiveTopicName(this.questionTopicName);
    this.localStorageService.updateLastSelectedQuestionTopicName(
      this.questionTopicName);
  }

  showTranslationTopicSelector(): boolean {
    const activeTabDetail = this.tabsDetails[
      this.activeTabName as keyof ContributorDashboardTabsDetails];
    const activeSuggestionType =
      this.contributionAndReviewService.getActiveSuggestionType();
    const activeTabType = this.contributionAndReviewService.getActiveTabType();
    return activeTabDetail.customizationOptions.includes('topic') ||
      (
        activeTabType === 'reviews' &&
        activeSuggestionType === 'translate_content' &&
        this.activeTabName !== 'submitQuestionTab'
      );
  }

  showQuestionTopicSelector(): boolean {
    const activeTabDetail = this.tabsDetails[
      this.activeTabName as keyof ContributorDashboardTabsDetails];
    const activeSuggestionType =
      this.contributionAndReviewService.getActiveSuggestionType();
    const activeTabType = this.contributionAndReviewService.getActiveTabType();
    return(
        activeTabType === 'reviews' && this.activeTabName === 'submitQuestionTab'
      );
  }

  getLanguageDescriptions(languageCodes: string[]): string[] {
    const languageDescriptions: string[] = [];
    languageCodes.forEach((languageCode) => {
      languageDescriptions.push(
        this.languageUtilService.getAudioLanguageDescription(
          languageCode));
    });
    return languageDescriptions;
  }

  ngOnInit(): void {
    this.username = '';
    this.userInfoIsLoading = true;
    this.userIsLoggedIn = false;
    this.userIsReviewer = false;
    this.userCanReviewTranslationSuggestionsInLanguages = [];
    this.userCanReviewVoiceoverSuggestionsInLanguages = [];
    this.userCanReviewQuestions = false;
    this.defaultHeaderVisible = true;

    const prevSelectedTopicName = (
      this.localStorageService.getLastSelectedTranslationTopicName());
    
    const prevSelectedQuestionTopicName = (
      this.localStorageService.getLastSelectedQuestionTopicName());
    console.log("\nPrevious Selected Question Topic \n",prevSelectedQuestionTopicName); 

    this.userService.getUserContributionRightsDataAsync().then(
      (userContributionRights) => {
        if (userContributionRights === null) {
          throw new Error('User contribution rights not found.');
        }
        this.userCanReviewTranslationSuggestionsInLanguages = (
          this.getLanguageDescriptions(
            userContributionRights
              .can_review_translation_for_language_codes));

        this.userCanReviewVoiceoverSuggestionsInLanguages = (
          this.getLanguageDescriptions(
            userContributionRights
              .can_review_voiceover_for_language_codes));

        this.userCanReviewQuestions = (
          userContributionRights.can_review_questions);

        this.userIsReviewer = (
          this.userCanReviewTranslationSuggestionsInLanguages
            .length > 0 ||
          this.userCanReviewVoiceoverSuggestionsInLanguages
            .length > 0 ||
          this.userCanReviewQuestions);

        this.tabsDetails.submitQuestionTab.enabled = (
          userContributionRights.can_suggest_questions);
      });

    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userInfoIsLoading = false;
      this.profilePictureWebpDataUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH));
      this.profilePicturePngDataUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH));
      if (userInfo.isLoggedIn()) {
        this.userIsLoggedIn = true;
        this.username = userInfo.getUsername();
        if (this.username !== null) {
          [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] = (
            this.userService.getProfileImageDataUrl(this.username));
        }
      } else {
        this.userIsLoggedIn = false;
        this.username = '';
      }
    });

    //diese Funktion anpassen falls wir eine neue Variable für TopicNameswithSkills nehmen 
    this.contributionOpportunitiesService.getTranslatableTopicNamesAsync()
      .then((topicNames) => {
        // TODO(#15710): Set default active topic to 'All'.
        if (topicNames.length <= 0) {
          this.translationTopicService.setActiveTopicName(
            ContributorDashboardConstants.DEFAULT_OPPORTUNITY_TOPIC_NAME);
          this.questionTopicService.setActiveTopicName(
            ContributorDashboardConstants.DEFAULT_OPPORTUNITY_TOPIC_NAME);
          return;
        }
        this.translationTopicName = topicNames[0];
        if (
          prevSelectedTopicName &&
          topicNames.indexOf(prevSelectedTopicName) !== -1
        ) {
          this.translationTopicName = prevSelectedTopicName;
        }
        this.translationTopicService.setActiveTopicName(this.translationTopicName);

        this.questionTopicName = topicNames[0]; 
        if(
          prevSelectedQuestionTopicName && 
          topicNames.indexOf(prevSelectedQuestionTopicName) !== -1 
        ){
          this.questionTopicName = prevSelectedTopicName; 
        }
        this.questionTopicService.setActiveTopicName(this.questionTopicName); 
      });
        

    this.activeTabName = 'myContributionTab';

    this.tabsDetails = {
      ...ContributorDashboardConstants.CONTRIBUTOR_DASHBOARD_TABS_DETAILS
    // TODO(#13015): Remove use of unknown as a type.
    } as unknown as ContributorDashboardTabsDetails;
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
  }
}

angular.module('oppia').directive('contributorDashboardPage',
  downgradeComponent({
    component: ContributorDashboardPageComponent
  }) as angular.IDirectiveFactory);
