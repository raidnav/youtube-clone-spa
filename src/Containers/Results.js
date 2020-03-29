import React, { useCallback, useEffect, useState, useContext } from "react";
import { YouTubeAPI } from "../Components/api/YoutubeApi";
import "./Sass/results_style.scss";
import { FilterSvg } from "./Svg";
import {
  RippleButton,
  ResultVideoContainer,
  ResultChannelContainer,
  ResultPlaylistContainer,
  Filter,
  MessageBox
} from "../Components";
import { UrlLocationContext } from "../Context/UrlLocationContext";
import { UrlLocation, ReturnTheme } from "../config";
import { useParams } from "react-router";
import { ThemeContext } from "../Context/ThemeContext";
import { GuideContext } from "../Context/GuideContext";

let SearchArray = [];

const Results = React.memo(() => {
  // Get Route Param
  let { id } = useParams();

  // API Collector State
  const [SearchResult, setSearchResult] = useState([]);

  // Theme context
  const [YtTheme] = useContext(ThemeContext);
  const Theme = YtTheme.isDarkTheme;

  // Filter drop state

  const [ShowFilterDrop, setShowFilterDrop] = useState(false);
  const [FilterState, setFilterState] = useState();

  // Guide Context
  const [GuideTrigger, setGuideTrigger] = useContext(GuideContext);

  // Message Error State
  const [
    { show, message, btnMessage, isError },
    setShowErrorMessage
  ] = useState({
    show: false,
    message: "",
    btnMessage: "",
    isError: false
  });

  // ===========================
  //  Handle Location Context
  // ===========================
  const [UrlLocationState, setUrlLocationState] = useContext(
    UrlLocationContext
  );

  useEffect(() => {
    // home location set to true
    const UrlLoc = UrlLocation(false);
    if (UrlLoc !== UrlLocationState) {
      setUrlLocationState(() => UrlLoc);
    }
  }, []);

  useEffect(() => {
    setGuideTrigger(GuideTrigger + 1);
    if (FilterState !== undefined) {
      if (!("defaultType" in FilterState)) {
        SearchRequest(
          Object.keys(FilterState)[0],
          FilterState[Object.keys(FilterState)[0]]
        );
      } else {
        SearchRequest();
      }
    } else {
      SearchRequest();
    }
  }, [id, FilterState]);

  // ===========================
  //           SEARCH
  // ===========================
  const SearchRequest = async (parameter = false, option = false) => {
    YouTubeAPI.get("search", {
      params:
        parameter && option
          ? {
              part: "snippet",
              maxResults: 2,
              q: id,
              key: process.env.REACT_APP_YOUTUBE_API_KEY,
              [parameter]: option
            }
          : {
              part: "snippet",
              maxResults: 2,
              q: id,
              key: process.env.REACT_APP_YOUTUBE_API_KEY
            }
    })
      .then(res => {
        res.data.items.map(res => {
          return (SearchArray = [
            ...SearchArray,
            {
              thumbnail:
                "maxres" in res.snippet.thumbnails
                  ? res.snippet.thumbnails.maxres.url
                  : res.snippet.thumbnails.medium.url,
              channelTitle: res.snippet.channelTitle,
              channelId: res.snippet.channelId,
              videoId: res.id.kind === "youtube#video" ? res.id.videoId : false,
              playlistId:
                res.id.kind === "youtube#playlist" ? res.id.playlistId : false,
              publishedAt: res.snippet.publishedAt,
              title: res.snippet.title,
              description: res.snippet.description
            }
          ]);
        });

        setSearchResult([...SearchArray]);
        SearchArray = [];
        if (ShowFilterDrop) {
          setShowFilterDrop(false);
        }
      })
      .catch(err => {
        // Error Setup
        setShowErrorMessage({
          show: true,
          message: `${err}`,
          btnMessage: "dismiss",
          isError: true
        });
      });
  };

  const handleFilterClick = useCallback(() => {
    setShowFilterDrop(!ShowFilterDrop);
  }, [ShowFilterDrop]);

  // ====================================
  //           Error Handling
  // ====================================

  const HandleClosingMessageBox = useCallback(() => {
    // Just to make sure isError will not
    // change to false by any chance before doing some logic if true
    try {
      if (isError) {
      }
    } finally {
      setShowErrorMessage(pre => {
        return {
          show: false,
          message: pre.message,
          btnMessage: pre.btnMessage,
          isError: false
        };
      });
    }
  }, [isError]);

  const HandleShowMessageBox = useCallback(
    (watchLater, ch = false) => {
      if (!ch) {
        setShowErrorMessage({
          show: true,
          message: !watchLater
            ? "Saved to Watch later"
            : "Removed from Watch later",
          btnMessage: "UNDO",
          isError: false
        });
      } else {
        setShowErrorMessage({
          show: true,
          message: !watchLater ? "Subscription added" : "Subscription removed",
          btnMessage: "",
          isError: false
        });
      }

      setTimeout(() => {
        HandleClosingMessageBox();
      }, 4000);
    },
    [HandleClosingMessageBox]
  );

  return (
    <div id="hvc" className="results_container">
      <div className="results_contentwrapper">
        {/* FILTER AREA */}
        <RippleButton onclick={handleFilterClick} classname="header_container">
          <div className="header_wrapper">
            <div className="header_icon">
              <FilterSvg Theme={Theme} />
            </div>
            <span className={`header_text header_text-${ReturnTheme(Theme)}`}>
              filter
            </span>
          </div>
        </RippleButton>

        <Filter
          ShowFilterDrop={ShowFilterDrop}
          setFilterState={setFilterState}
          FilterState={FilterState}
        />

        {/* END FILTER AREA */}
        <div className={`r_line r_line-${ReturnTheme(Theme)}`}></div>
        <div className="results_section_list">
          {SearchResult.map((item, index) => {
            return item.videoId ? (
              <ResultVideoContainer
                key={index}
                index={index}
                item={item}
                HandleShowMessageBox={HandleShowMessageBox}
              />
            ) : !item.playlistId ? (
              <ResultChannelContainer
                key={index}
                index={index}
                item={item}
                HandleShowMessageBox={HandleShowMessageBox}
              />
            ) : (
              <ResultPlaylistContainer key={index} index={index} item={item} />
            );
          })}
        </div>
      </div>
      <MessageBox
        message={message}
        btnMessage={btnMessage}
        show={show}
        HandleMessageBtn={HandleClosingMessageBox}
      />
    </div>
  );
});

export default Results;
